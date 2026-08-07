"""
NSE official bhavcopy fetcher — free, no API key, but published as one
CSV per trading day covering the *entire* market rather than a
per-symbol history endpoint.

Role in this pipeline:
  - PRIMARY history still comes from yfinance (app.data.fetch) — bulk
    backfilling 15-20 years via bhavcopy would mean one HTTP request per
    trading day (~5,000+ requests), which isn't practical to run on
    every training pass.
  - bhavcopy is used here as a FALLBACK/cross-check: topping up the most
    recent few days when yfinance is thin/empty (which happens — Yahoo's
    unofficial endpoint has gotten less reliable), and as an independent
    source to validate suspicious-looking recent bars before they reach
    the cleaning step.

NSE's archive endpoint wants a browser-like session: a warm-up GET to
the main site first (to pick up cookies), then the actual archive
request with those cookies attached. Without this it typically 403s.
"""

import io
import time
from datetime import date, timedelta

import pandas as pd
import requests

BASE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/csv,application/csv,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.nseindia.com/all-reports",
}

WARMUP_URL = "https://www.nseindia.com/all-reports"
ARCHIVE_URL_TMPL = "https://nsearchives.nseindia.com/products/content/sec_bhavdata_full_{ddmmyyyy}.csv"


def _session() -> requests.Session:
    s = requests.Session()
    s.headers.update(BASE_HEADERS)
    try:
        s.get(WARMUP_URL, timeout=10)  # picks up cookies NSE expects on the next request
    except requests.RequestException:
        pass  # some days this warm-up itself fails; still worth trying the archive call
    return s


def _strip_ns_suffix(symbol: str) -> str:
    """bhavcopy uses bare NSE codes ('RELIANCE'), not the yfinance-style
    '.NS' suffix ('RELIANCE.NS'). Index tickers like '^NSEI' aren't in
    the equity bhavcopy file at all -- caller should skip those."""
    return symbol[:-3] if symbol.endswith(".NS") else symbol


def fetch_bhavcopy_day(day: date, session: requests.Session = None) -> pd.DataFrame | None:
    """
    Fetch and parse one full day's NSE bhavcopy (all equities). Returns
    None on holidays/weekends/fetch failure rather than raising, since
    the caller is expected to be walking a date range and skipping
    non-trading days is normal, not exceptional.
    """
    sess = session or _session()
    url = ARCHIVE_URL_TMPL.format(ddmmyyyy=day.strftime("%d%m%Y"))
    try:
        resp = sess.get(url, timeout=15)
        if resp.status_code != 200 or not resp.content:
            return None
        df = pd.read_csv(io.BytesIO(resp.content))
    except (requests.RequestException, pd.errors.ParserError):
        return None

    df.columns = [c.strip().upper() for c in df.columns]
    # NSE's current sec_bhavdata_full format uses verbose column names
    # (OPEN_PRICE, TTL_TRD_QNTY, ...). Match tolerantly since NSE has
    # changed this format before and will likely again.
    col_candidates = {
        "Symbol": ["SYMBOL"],
        "Series": ["SERIES"],
        "Open": ["OPEN_PRICE", "OPEN"],
        "High": ["HIGH_PRICE", "HIGH"],
        "Low": ["LOW_PRICE", "LOW"],
        "Close": ["CLOSE_PRICE", "CLOSE"],
        "Volume": ["TTL_TRD_QNTY", "TOTTRDQTY", "TOT_TRD_QTY"],
    }
    resolved = {}
    for target, candidates in col_candidates.items():
        found = next((c for c in candidates if c in df.columns), None)
        if found is None:
            return None  # format changed in a way we don't recognize -- fail loud upstream, don't guess
        resolved[target] = found

    df = df.rename(columns={v: k for k, v in resolved.items()})[list(resolved.keys())]
    df["Series"] = df["Series"].astype(str).str.strip()
    df = df[df["Series"] == "EQ"]
    df["Symbol"] = df["Symbol"].astype(str).str.strip()
    df["Date"] = pd.Timestamp(day)
    return df.drop(columns=["Series"])


def fetch_bhavcopy_recent(symbol: str, days: int = 5) -> pd.DataFrame:
    """
    Fallback for app.data.fetch.fetch_recent: walk backward from today
    over calendar days (skipping ones with no bhavcopy file -- weekends
    and NSE holidays), collecting up to `days` trading days of OHLCV for
    one symbol. Returns an empty DataFrame if nothing could be fetched,
    same contract as an empty yfinance result.
    """
    bare = _strip_ns_suffix(symbol)
    sess = _session()
    rows = []
    d = date.today()
    checked = 0
    while len(rows) < days and checked < days + 15:  # generous cushion for weekends/holidays
        day_df = fetch_bhavcopy_day(d, session=sess)
        checked += 1
        if day_df is not None:
            match = day_df[day_df["Symbol"] == bare]
            if not match.empty:
                rows.append(match.iloc[0])
        d -= timedelta(days=1)
        time.sleep(0.3)  # be polite to NSE's servers

    if not rows:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])

    out = pd.DataFrame(rows).set_index("Date").sort_index()
    return out[["Open", "High", "Low", "Close", "Volume"]]


def fetch_bhavcopy_range(symbol: str, start: date, end: date) -> pd.DataFrame:
    """
    Backfill one symbol's OHLCV over an explicit date range by walking
    every calendar day in between. This is the "slow but official" path
    -- only use it for filling a known, specific gap (e.g. a handful of
    days yfinance is missing), not for bulk multi-year history.
    """
    bare = _strip_ns_suffix(symbol)
    sess = _session()
    rows = []
    d = start
    while d <= end:
        day_df = fetch_bhavcopy_day(d, session=sess)
        if day_df is not None:
            match = day_df[day_df["Symbol"] == bare]
            if not match.empty:
                rows.append(match.iloc[0])
        d += timedelta(days=1)
        time.sleep(0.3)

    if not rows:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])

    out = pd.DataFrame(rows).set_index("Date").sort_index()
    return out[["Open", "High", "Low", "Close", "Volume"]]
