"""
XGBoost BUY/HOLD/SELL classifier — cleaned, leak-checked pipeline.

What changed vs. the old script:
  1. Real data cleaning per symbol (app.data.data_cleaning.clean_ohlcv)
     instead of a bare dropna — handles dupes, bad ticks, price spikes,
     short gaps.
  2. Bigger, still-causal feature set (RSI, MACD, Bollinger %B, ATR,
     lagged returns, multi-window momentum/volatility) via the shared
     app.services.feature_engineering module, so train and inference
     can't drift apart.
  3. Per-symbol chronological split with a purge gap around the
     boundary, so rolling-window features / the forward-looking label
     can't leak across train/test.
  4. Hyperparameter search with TimeSeriesSplit (walk-forward CV) on the
     training portion only, instead of hand-picked constants.
  5. Walk-forward *evaluation*: after tuning, we re-validate across
     multiple expanding-window folds on the held-out test range, not
     just a single train/test accuracy number, so a lucky split can't
     flatter the result.

Run this where the sandbox actually has network access to Yahoo Finance
(your local machine / Colab) — training here isn't possible because this
environment's egress is locked to package registries only.
"""

import json
import os

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit
from sklearn.utils.class_weight import compute_class_weight
from collections import Counter

from app.data.data_cleaning import clean_ohlcv, purge_split_boundary
from app.data.fetch import fetch_recent  # noqa: F401  (kept for parity/manual checks)
from app.services.feature_engineering import add_features, make_labels, XGB_FEATURES

import yfinance as yf

SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "ITC.NS", "BHARTIARTL.NS", "SBIN.NS", "WIPRO.NS", "SUNPHARMA.NS",
    "LT.NS", "^NSEI", "^NSEBANK", "^BSESN",
]

TEST_FRACTION = 0.2
PURGE_GAP = 20          # >= longest rolling window used in features (volatility_20)
LABEL_THRESHOLD_MULTIPLIER = 1.5  # see feature_engineering.make_labels docstring — 1.0x was mostly noise
N_SEARCH_ITER = 30      # RandomizedSearchCV iterations
CV_FOLDS = 5
OUT_DIR = "saved_models"
os.makedirs(OUT_DIR, exist_ok=True)


def build_symbol_dataset(symbol: str):
    """Fetch, clean, feature-engineer, and label one symbol. Returns
    (X_train, y_train, X_test, y_test) already purged at the boundary,
    or None if there isn't enough clean data."""
    print(f"Processing {symbol}...")
    df = yf.download(symbol, period="5y", interval="1d", auto_adjust=True)
    if df.empty:
        print(f"  skipping {symbol}: no data")
        return None

    df = clean_ohlcv(df, symbol=symbol)
    if len(df) < 300:
        print(f"  skipping {symbol}: only {len(df)} clean rows")
        return None

    df = add_features(df)
    df = make_labels(df, threshold_multiplier=LABEL_THRESHOLD_MULTIPLIER)
    if len(df) < 200:
        print(f"  skipping {symbol}: only {len(df)} rows after features/labels")
        return None

    split_idx = int(len(df) * (1 - TEST_FRACTION))
    train_end, test_start = purge_split_boundary(df, split_idx, PURGE_GAP)
    if train_end < 100 or (len(df) - test_start) < 30:
        print(f"  skipping {symbol}: not enough data on one side of the purge gap")
        return None

    train_df = df.iloc[:train_end]
    test_df = df.iloc[test_start:]

    X_train = train_df[XGB_FEATURES].values
    y_train = train_df["label"].values.astype(int)
    X_test = test_df[XGB_FEATURES].values
    y_test = test_df["label"].values.astype(int)

    return X_train, y_train, X_test, y_test


def main():
    train_X, train_y, test_X, test_y = [], [], [], []

    for symbol in SYMBOLS:
        result = build_symbol_dataset(symbol)
        if result is None:
            continue
        Xtr, ytr, Xte, yte = result
        train_X.append(Xtr)
        train_y.append(ytr)
        test_X.append(Xte)
        test_y.append(yte)

    if not train_X:
        raise RuntimeError("No symbols produced usable data — check network access / symbols list.")

    X_train = np.vstack(train_X)
    y_train = np.concatenate(train_y)
    X_test = np.vstack(test_X)
    y_test = np.concatenate(test_y)

    print("\nTrain shape:", X_train.shape, "Test shape:", X_test.shape)
    print("Train label distribution:", Counter(y_train))
    print("Test label distribution:", Counter(y_test))

    # -------- CLASS BALANCING --------
    classes = np.unique(y_train)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
    class_weights = dict(zip(classes, weights))
    sample_weights = np.array([class_weights[label] for label in y_train])

    # -------- HYPERPARAMETER SEARCH (walk-forward CV on train only) --------
    base_model = xgb.XGBClassifier(
        tree_method="hist",
        objective="multi:softprob",
        num_class=3,
        eval_metric="mlogloss",
    )

    param_dist = {
        "n_estimators": [200, 300, 400, 600, 800],
        "max_depth": [3, 4, 5, 6, 8],
        "learning_rate": [0.01, 0.02, 0.05, 0.08, 0.1],
        "subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
        "colsample_bytree": [0.6, 0.7, 0.8, 0.9, 1.0],
        "min_child_weight": [1, 3, 5, 7],
        "gamma": [0, 0.1, 0.3, 0.5],
        "reg_lambda": [0.5, 1.0, 2.0, 5.0],
    }

    tscv = TimeSeriesSplit(n_splits=CV_FOLDS)

    search = RandomizedSearchCV(
        base_model,
        param_distributions=param_dist,
        n_iter=N_SEARCH_ITER,
        scoring="f1_macro",
        cv=tscv,
        n_jobs=-1,
        random_state=42,
        verbose=1,
    )

    print("\nRunning hyperparameter search (walk-forward CV)...")
    search.fit(X_train, y_train, sample_weight=sample_weights)

    print("\nBest params:", search.best_params_)
    print("Best CV f1_macro:", round(search.best_score_, 4))

    model = search.best_estimator_

    # -------- WALK-FORWARD RE-VALIDATION ON TEST RANGE --------
    # Refit on expanding windows within the (purged) test range and score
    # each fold, instead of trusting one single train/test cut.
    print("\nWalk-forward validation on held-out range:")
    wf = TimeSeriesSplit(n_splits=4)
    fold_scores = []
    fold_f1_scores = []
    for fold, (tr_idx, val_idx) in enumerate(wf.split(X_test), start=1):
        if len(tr_idx) < 50 or len(val_idx) < 20:
            continue
        fold_model = xgb.XGBClassifier(**search.best_params_, tree_method="hist",
                                        objective="multi:softprob", num_class=3,
                                        eval_metric="mlogloss")
        combined_X = np.vstack([X_train, X_test[tr_idx]])
        combined_y = np.concatenate([y_train, y_test[tr_idx]])
        fold_classes = np.unique(combined_y)
        fold_weights = compute_class_weight(class_weight="balanced", classes=fold_classes, y=combined_y)
        fold_class_weights = dict(zip(fold_classes, fold_weights))
        fold_sample_weights = np.array([fold_class_weights[label] for label in combined_y])
        fold_model.fit(combined_X, combined_y, sample_weight=fold_sample_weights)
        preds = fold_model.predict(X_test[val_idx])
        acc = accuracy_score(y_test[val_idx], preds)
        f1m = f1_score(y_test[val_idx], preds, average="macro")
        fold_scores.append(acc)
        fold_f1_scores.append(f1m)
        print(f"  fold {fold}: acc={acc:.4f} f1_macro={f1m:.4f} (train={len(combined_y)}, val={len(val_idx)})")

    if fold_scores:
        print(f"  mean walk-forward accuracy: {np.mean(fold_scores):.4f} "
              f"(+/- {np.std(fold_scores):.4f})")
        print(f"  mean walk-forward f1_macro: {np.mean(fold_f1_scores):.4f} "
              f"(+/- {np.std(fold_f1_scores):.4f})")

    # -------- FINAL HOLD-OUT EVALUATION --------
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print("\nFinal hold-out accuracy:", round(accuracy * 100, 2), "%")
    print("\nClassification report:")
    print(classification_report(y_test, y_pred, target_names=["SELL", "HOLD", "BUY"]))
    print("\nConfusion matrix:")
    print(confusion_matrix(y_test, y_pred))

    importances = sorted(
        zip(XGB_FEATURES, model.feature_importances_), key=lambda t: -t[1]
    )
    print("\nFeature importances:")
    for name, imp in importances:
        print(f"  {name}: {imp:.4f}")

    # -------- SAVE --------
    model.save_model(os.path.join(OUT_DIR, "xgb.json"))
    with open(os.path.join(OUT_DIR, "xgb_features.json"), "w") as f:
        json.dump(XGB_FEATURES, f, indent=2)
    with open(os.path.join(OUT_DIR, "xgb_metrics.json"), "w") as f:
        json.dump({
            "holdout_accuracy": accuracy,
            "walk_forward_accuracy_mean": float(np.mean(fold_scores)) if fold_scores else None,
            "walk_forward_accuracy_std": float(np.std(fold_scores)) if fold_scores else None,
            "walk_forward_f1_macro_mean": float(np.mean(fold_f1_scores)) if fold_f1_scores else None,
            "walk_forward_f1_macro_std": float(np.std(fold_f1_scores)) if fold_f1_scores else None,
            "best_params": search.best_params_,
            "best_cv_f1_macro": search.best_score_,
        }, f, indent=2)

    print("\nModel, feature list, and metrics saved to saved_models/")


if __name__ == "__main__":
    main()
