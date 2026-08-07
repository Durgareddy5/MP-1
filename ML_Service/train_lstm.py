"""
LSTM return regressors — TWO independently trained models sharing the
same data pipeline:
  - lstm_1d.keras: next-day forward return ("trap" horizon — expected to
    sit close to a noise floor; a useful contrast case for the report,
    since daily direction is close to random-walk for price/volume
    features alone per the literature)
  - lstm_5d.keras: 5-trading-day forward return (the horizon expected to
    carry more real signal)

Two separate models (not one shared trunk) so each is tuned, trained,
and evaluated fully independently -- cleanest for a side-by-side
comparison in a report, at the cost of training twice.

What changed vs. the original single-output script:
  1. Real data cleaning per symbol (app.data.data_cleaning.clean_ohlcv).
  2. Shared app.services.feature_engineering module (same functions
     inference.py uses) with price-relative (not raw-price-level)
     features, RSI/MACD/ATR/Bollinger on top of the original 4.
  3. Two forward-looking targets (add_forward_targets) instead of one,
     still fully causal on the feature side -- future_return_* columns
     are targets only, never fed into X.
  4. Scaler fit ONLY on the training slice (shared across both models,
     since the input feature set is identical -- only the target
     differs), not on train+test combined.
  5. A purge gap removed around the chronological train/test boundary so
     no 60-day input sequence (or its forward-looking label) spans
     across it.
  6. A small architecture/learning-rate sweep per model, validated on a
     chronological holdout slice, with early stopping.

Run this where the sandbox actually has network access to Yahoo Finance
(your local machine / Colab) -- training here isn't possible because
this environment's egress is locked to package registries only.
"""

import json
import os

import numpy as np
import pandas as pd
import joblib
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam

from app.data.data_cleaning import clean_ohlcv, purge_split_boundary
from app.services.feature_engineering import add_features, add_forward_targets, LSTM_FEATURES

SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "ITC.NS", "BHARTIARTL.NS", "SBIN.NS", "WIPRO.NS", "SUNPHARMA.NS",
    "LT.NS", "^NSEI", "^NSEBANK", "^BSESN", "^INDIAVIX", "^CNX100",
    "^CRSLDX", "^CNXIT", "^CNXPHARMA", "^CNXAUTO", "^CNXFMCG",
    "^CNXMETAL", "^CNXREALTY", "^CNXENERGY", "^CNXINFRA", "^CNXPSUBANK",
    "^NSEMDCP50", "^NSMIDCP", "^CNXSC",
]

HORIZONS = (1, 5)
SEQ_LENGTH = 60
TEST_FRACTION = 0.2
PURGE_GAP = 20 + SEQ_LENGTH  # rolling-window warmup + sequence length; comfortably covers the 5-day label lookahead too
OUT_DIR = "saved_models"
os.makedirs(OUT_DIR, exist_ok=True)


def make_sequences(feature_matrix: np.ndarray, target: np.ndarray, seq_len: int):
    """A window covering rows [i, i+seq_len) is anchored at day
    k = i+seq_len-1 (its last day); the target is read from that same
    anchor day so the model always sees 'what happens after this window'."""
    X, y = [], []
    for i in range(len(feature_matrix) - seq_len + 1):
        k = i + seq_len - 1
        if k >= len(target):
            break
        X.append(feature_matrix[i:i + seq_len])
        y.append(target[k])
    if not X:
        return np.empty((0, seq_len, feature_matrix.shape[1])), np.empty((0,))
    return np.array(X), np.array(y)


def build_symbol_frames(symbol: str):
    """Fetch + clean + feature-engineer + label one symbol (both
    horizons at once, so both models train on identical rows/splits).
    Returns (train_df, test_df) with the purge gap applied, or None."""
    print(f"Processing {symbol}...")
    df = yf.download(symbol, period="20y", interval="1d", auto_adjust=True)
    if df.empty:
        print(f"  skipping {symbol}: no data")
        return None

    df = clean_ohlcv(df, symbol=symbol)
    if len(df) < 400:
        print(f"  skipping {symbol}: only {len(df)} clean rows")
        return None

    df = add_features(df)
    df = add_forward_targets(df, horizons=HORIZONS)
    if len(df) < SEQ_LENGTH + 100:
        print(f"  skipping {symbol}: only {len(df)} rows after features/targets")
        return None

    split_idx = int(len(df) * (1 - TEST_FRACTION))
    train_end, test_start = purge_split_boundary(df, split_idx, PURGE_GAP)
    if train_end < SEQ_LENGTH + 50 or (len(df) - test_start) < SEQ_LENGTH + 20:
        print(f"  skipping {symbol}: not enough data on one side of the purge gap")
        return None

    return df.iloc[:train_end], df.iloc[test_start:]


def build_model(n_features: int, units: int, dropout: float, lr: float) -> Sequential:
    model = Sequential([
        LSTM(units, return_sequences=True, input_shape=(SEQ_LENGTH, n_features)),
        Dropout(dropout),
        LSTM(units),
        Dropout(dropout),
        Dense(16, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer=Adam(learning_rate=lr), loss="mse", metrics=["mae"])
    return model


def train_one_horizon(horizon: int, train_frames, test_frames, scaler):
    """Full sweep + train + evaluate for a single forward-return horizon.
    Returns (best_model, metrics_dict, best_cfg)."""
    target_col = f"future_return_{horizon}"

    def to_sequences(frames):
        all_X, all_y = [], []
        for d in frames:
            scaled = scaler.transform(d[LSTM_FEATURES].values)
            scaled = np.clip(scaled, 0, 1)
            target = d[target_col].values
            Xs, ys = make_sequences(scaled, target, SEQ_LENGTH)
            if len(Xs) == 0:
                continue
            all_X.append(Xs)
            all_y.append(ys)
        if not all_X:
            return np.empty((0, SEQ_LENGTH, len(LSTM_FEATURES))), np.empty((0,))
        return np.vstack(all_X), np.concatenate(all_y)

    X_train_full, y_train_full = to_sequences(train_frames)
    X_test, y_test = to_sequences(test_frames)

    print(f"\n=== Horizon: {horizon}-day ===")
    print("Train sequence shape:", X_train_full.shape)
    print("Test sequence shape:", X_test.shape)

    val_cut = int(len(X_train_full) * 0.85)
    X_train, y_train = X_train_full[:val_cut], y_train_full[:val_cut]
    X_val, y_val = X_train_full[val_cut:], y_train_full[val_cut:]

    configs = [
        {"units": 64, "dropout": 0.2, "lr": 1e-3},
        {"units": 96, "dropout": 0.3, "lr": 5e-4},
        {"units": 64, "dropout": 0.3, "lr": 5e-4},
    ]

    best_val_loss = np.inf
    best_model = None
    best_cfg = None

    for cfg in configs:
        print(f"\n[{horizon}d] Trying config: {cfg}")
        model = build_model(len(LSTM_FEATURES), cfg["units"], cfg["dropout"], cfg["lr"])
        es = EarlyStopping(monitor="val_loss", patience=6, restore_best_weights=True)
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=60,
            batch_size=32,
            callbacks=[es],
            verbose=0,
        )
        val_loss = min(history.history["val_loss"])
        print(f"  best val_loss: {val_loss:.6f} (stopped at epoch {len(history.history['val_loss'])})")
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model = model
            best_cfg = cfg

    print(f"\n[{horizon}d] Best config: {best_cfg} (val_loss={best_val_loss:.6f})")

    y_pred = best_model.predict(X_test, verbose=0).flatten()
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    direction_acc = float(np.mean(np.sign(y_pred) == np.sign(y_test)))

    print(f"[{horizon}d] Hold-out MAE: {mae:.6f}")
    print(f"[{horizon}d] Hold-out RMSE: {rmse:.6f}")
    print(f"[{horizon}d] Directional accuracy (sign match): {direction_acc*100:.2f}%")

    metrics = {
        "mae": mae, "rmse": rmse, "directional_accuracy": direction_acc,
        "best_config": best_cfg, "best_val_loss": float(best_val_loss),
    }
    return best_model, metrics


def main():
    train_frames, test_frames = [], []
    for symbol in SYMBOLS:
        result = build_symbol_frames(symbol)
        if result is None:
            continue
        train_df, test_df = result
        train_frames.append(train_df)
        test_frames.append(test_df)

    if not train_frames:
        raise RuntimeError("No symbols produced usable data — check network access / symbols list.")

    # -------- FIT ONE SHARED SCALER ON TRAIN ONLY --------
    # Both models see identical input features (only the target differs),
    # so one scaler fit on the training slice serves both.
    scaler = MinMaxScaler()
    train_features_concat = pd.concat([d[LSTM_FEATURES] for d in train_frames], axis=0)
    scaler.fit(train_features_concat.values)

    all_metrics = {}
    for horizon in HORIZONS:
        model, metrics = train_one_horizon(horizon, train_frames, test_frames, scaler)
        model.save(os.path.join(OUT_DIR, f"lstm_{horizon}d.keras"))
        all_metrics[horizon] = metrics
        print(f"\nSaved lstm_{horizon}d.keras")

    joblib.dump(scaler, os.path.join(OUT_DIR, "scaler.save"))
    with open(os.path.join(OUT_DIR, "lstm_features.json"), "w") as f:
        json.dump(LSTM_FEATURES, f, indent=2)
    with open(os.path.join(OUT_DIR, "lstm_metrics.json"), "w") as f:
        json.dump({str(h): all_metrics[h] for h in HORIZONS}, f, indent=2)

    print("\n=== Summary ===")
    for h in HORIZONS:
        m = all_metrics[h]
        print(f"  {h}-day: MAE={m['mae']:.6f}  RMSE={m['rmse']:.6f}  "
              f"directional_acc={m['directional_accuracy']*100:.2f}%")
    print("\nNote: the 1-day model is the deliberate 'trap' horizon — expect it")
    print("to sit close to 50% directional accuracy. If 5-day isn't meaningfully")
    print("above it, that's a real (and reportable) finding, not a bug.")
    print("\nModels, scaler, feature list, and metrics saved to saved_models/")


if __name__ == "__main__":
    main()
