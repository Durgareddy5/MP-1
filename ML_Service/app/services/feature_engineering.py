"""
Shared feature engineering for both the LSTM and XGBoost pipelines, and
for live inference. Keeping one copy means training and inference can
never silently drift apart (the old bug where inference.py hand-recomputed
a slightly different feature set than the training scripts).

Every feature is computed with rolling/ewm/shift windows, i.e. only past
and present bars. None of this ever peeks forward.
"""

import numpy as np
import pandas as pd

LSTM_FEATURES = ["returns", "ema_20", "ema_50", "vol_change", "rsi_14", "macd_hist"]
XGB_FEATURES = [
    "returns", "ema_20", "ema_50", "vol_change",
    "trend", "momentum_5", "momentum_10", "volatility_10", "volatility_20",
    "rsi_14", "macd", "macd_signal", "macd_hist",
    "bb_percent", "atr_14",
    "lag1_return", "lag2_return", "lag3_return",
]


def _rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50.0)


def _macd(close: pd.Series, fast=12, slow=26, signal=9):
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    hist = macd_line - signal_line
    return macd_line, signal_line, hist


def _bollinger_percent_b(close: pd.Series, window: int = 20, n_std: float = 2.0) -> pd.Series:
    mid = close.rolling(window).mean()
    std = close.rolling(window).std()
    upper = mid + n_std * std
    lower = mid - n_std * std
    width = (upper - lower).replace(0, np.nan)
    return ((close - lower) / width).clip(-0.5, 1.5)


def _atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Input: cleaned OHLCV frame (see app.data.data_cleaning.clean_ohlcv),
    indexed by date, ascending.
    Output: df with all engineered columns added, NaNs from warmup
    windows dropped, and extreme values clipped.

    IMPORTANT: every feature here is price-RELATIVE (a ratio/percentage),
    never a raw price level or raw price difference. This matters because
    symbols in this pipeline range from ~Rs100 to ~Rs3000+ per share and
    get trained on together: a raw feature like "ema_20 - ema_50" means a
    completely different thing for a Rs100 stock than a Rs3000 one, and
    for the LSTM it's worse -- the shared MinMaxScaler is fit across all
    symbols at once, so raw price-level columns get dominated by whichever
    symbol has the highest price, squashing the signal for cheaper stocks
    toward zero. Keeping everything as a ratio/percentage sidesteps both
    problems.
    """
    df = df.copy()

    df["returns"] = df["Close"].pct_change()
    ema_20 = df["Close"].ewm(span=20, adjust=False).mean()
    ema_50 = df["Close"].ewm(span=50, adjust=False).mean()
    df["ema_20"] = df["Close"] / ema_20 - 1     # price's distance from its own 20d EMA, as a ratio
    df["ema_50"] = df["Close"] / ema_50 - 1     # same, 50d
    df["vol_change"] = df["Volume"].pct_change()

    df["trend"] = (ema_20 - ema_50) / df["Close"]           # EMA spread, scaled by price
    df["momentum_5"] = df["Close"].pct_change(5)             # 5-day return, not raw price diff
    df["momentum_10"] = df["Close"].pct_change(10)           # 10-day return, not raw price diff
    df["volatility_10"] = df["returns"].rolling(10).std()
    df["volatility_20"] = df["returns"].rolling(20).std()

    df["rsi_14"] = _rsi(df["Close"], 14)
    macd_line, macd_signal, macd_hist = _macd(df["Close"])
    df["macd"] = macd_line / df["Close"]              # MACD as % of price, not raw Rs
    df["macd_signal"] = macd_signal / df["Close"]
    df["macd_hist"] = macd_hist / df["Close"]

    df["bb_percent"] = _bollinger_percent_b(df["Close"])

    if "High" in df.columns and "Low" in df.columns:
        df["atr_14"] = _atr(df["High"], df["Low"], df["Close"], 14) / df["Close"]  # ATR as % of price
    else:
        df["atr_14"] = df["returns"].rolling(14).std()

    df["lag1_return"] = df["returns"].shift(1)
    df["lag2_return"] = df["returns"].shift(2)
    df["lag3_return"] = df["returns"].shift(3)

    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)

    df["returns"] = df["returns"].clip(-0.2, 0.2)
    df["vol_change"] = df["vol_change"].clip(-1, 1)
    df["rsi_14"] = df["rsi_14"].clip(0, 100)
    df["bb_percent"] = df["bb_percent"].clip(-0.5, 1.5)
    df["ema_20"] = df["ema_20"].clip(-0.5, 0.5)
    df["ema_50"] = df["ema_50"].clip(-0.5, 0.5)
    df["trend"] = df["trend"].clip(-0.3, 0.3)
    df["momentum_5"] = df["momentum_5"].clip(-0.5, 0.5)
    df["momentum_10"] = df["momentum_10"].clip(-0.5, 0.5)
    df["macd"] = df["macd"].clip(-0.2, 0.2)
    df["macd_signal"] = df["macd_signal"].clip(-0.2, 0.2)
    df["macd_hist"] = df["macd_hist"].clip(-0.2, 0.2)
    df["atr_14"] = df["atr_14"].clip(0, 0.3)

    return df


def make_labels(df: pd.DataFrame, threshold_multiplier: float = 1.5) -> pd.DataFrame:
    """
    3-class label for the XGB classifier: BUY(2) / HOLD(1) / SELL(0),
    based on whether next-bar return exceeds `threshold_multiplier` x
    trailing volatility.

    threshold_multiplier=1.0 (the old default) fires on almost any move
    bigger than a typical day, which floods BUY/SELL with noise rather
    than real signal -- confirmed empirically (see xgb_metrics.json from
    the 1.0x run: 39.67% hold-out accuracy, worse than the 70% majority-
    class baseline). 1.5x asks for a more convincing move before calling
    a trade, at the cost of fewer BUY/SELL examples to learn from.

    `future_return` is only used to build the label column here -- the
    caller must drop this column before it ever reaches X (see train_xgb.py).
    """
    df = df.copy()
    df["future_return"] = df["returns"].shift(-1)
    vol = df["returns"].rolling(20).std()
    df["label"] = np.where(
        df["future_return"] > threshold_multiplier * vol, 2,
        np.where(df["future_return"] < -threshold_multiplier * vol, 0, 1)
    )
    df.dropna(subset=["future_return", "label"], inplace=True)
    return df


def add_forward_targets(df: pd.DataFrame, horizons=(1, 5)) -> pd.DataFrame:
    """
    Add forward-looking regression targets, one column per horizon:
    future_return_{h} = Close[t+h] / Close[t] - 1.

    These are only ever valid as *targets* (y) -- never feed a
    future_return_* column into X. Drops the trailing `max(horizons)`
    rows per symbol where the forward window runs off the end of the
    data, so every remaining row has a real, fully-realized label.
    """
    df = df.copy()
    for h in horizons:
        df[f"future_return_{h}"] = df["Close"].shift(-h) / df["Close"] - 1
    df.dropna(subset=[f"future_return_{h}" for h in horizons], inplace=True)
    return df
