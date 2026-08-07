"""
Centralized OHLCV cleaning for TrAIde.

Design goal: every transform here only looks backward in time (or is a
structural fix like removing duplicate index rows), so nothing here can
leak future information into a training row. Keep it that way when you
extend it.
"""

import numpy as np
import pandas as pd

REQUIRED_COLS = ["Open", "High", "Low", "Close", "Volume"]


def flatten_columns(df: pd.DataFrame) -> pd.DataFrame:
    """yfinance returns a MultiIndex column when you pass a single symbol
    inside group_by='ticker', or when you download multiple tickers.
    Flatten to plain column names."""
    if isinstance(df.columns, pd.MultiIndex):
        df = df.copy()
        df.columns = df.columns.get_level_values(0)
    return df


def clean_ohlcv(
    df: pd.DataFrame,
    symbol: str = "",
    max_ffill_days: int = 3,
    price_outlier_z: float = 6.0,
) -> pd.DataFrame:
    """
    Clean a raw single-symbol OHLCV frame.

    Steps (in order, each one causal):
      1. Flatten MultiIndex columns, keep only OHLCV.
      2. Sort by date, drop duplicate timestamps (keep last).
      3. Coerce to numeric, turn non-positive prices/volume into NaN.
      4. Forward-fill short gaps (<= max_ffill_days) — covers exchange
         holidays / brief data-vendor gaps. Longer gaps are left as NaN
         and dropped, since ffill-ing a long gap fabricates a flat
         price series that would quietly corrupt returns/volatility.
      5. Flag and null out single-bar price spikes using a rolling
         z-score on log returns (computed only from data up to and
         including that bar) — catches vendor glitches like a stray
         10x tick. Uses a rolling (not global) mean/std, so it can't
         see the future.
      6. Drop any row still containing a NaN in a required column.

    Returns a cleaned copy; does not mutate the input.
    """
    df = flatten_columns(df)
    df = df.copy()

    keep = [c for c in REQUIRED_COLS if c in df.columns]
    if "Volume" not in df.columns:
        df["Volume"] = 0
        keep.append("Volume")
    df = df[keep]

    df = df[~df.index.duplicated(keep="last")].sort_index()

    for col in ["Open", "High", "Low", "Close"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df.loc[df[col] <= 0, col] = np.nan
    df["Volume"] = pd.to_numeric(df["Volume"], errors="coerce")
    df.loc[df["Volume"] < 0, "Volume"] = np.nan

    df = df.ffill(limit=max_ffill_days)

    if "Close" in df.columns and len(df) > 30:
        log_ret = np.log(df["Close"]).diff()
        roll_mean = log_ret.rolling(30, min_periods=10).mean()
        roll_std = log_ret.rolling(30, min_periods=10).std()
        z = (log_ret - roll_mean) / roll_std.replace(0, np.nan)
        spike = z.abs() > price_outlier_z
        if spike.any():
            df.loc[spike, ["Open", "High", "Low", "Close"]] = np.nan
            df = df.ffill(limit=max_ffill_days)

    before = len(df)
    df = df.dropna(subset=[c for c in REQUIRED_COLS if c in df.columns])
    after = len(df)
    if symbol and before != after:
        print(f"  [clean] {symbol}: dropped {before - after} unrecoverable rows "
              f"({before} -> {after})")

    return df


def purge_split_boundary(df: pd.DataFrame, split_idx: int, gap: int) -> tuple[int, int]:
    """
    Given a chronological split point, return (train_end, test_start)
    with `gap` rows removed on either side of the boundary.

    Any feature built from a rolling/EWM window of length <= gap can see
    into the other side of the split without this — e.g. a 20-day
    volatility feature computed for the first row of the test set uses
    the 19 preceding (training) days, and a label built from a forward
    return does the reverse at the end of the train set. Purging removes
    that overlap instead of pretending it doesn't exist.
    """
    train_end = max(0, split_idx - gap)
    test_start = min(len(df), split_idx + gap)
    return train_end, test_start
