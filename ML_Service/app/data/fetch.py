import yfinance as yf

# NOTE: downstream cleaning/feature code (app.data.data_cleaning,
# app.services.feature_engineering) needs Open/High/Low/Close/Volume —
# ATR in particular needs High/Low. Don't trim columns here; let the
# cleaning step decide what to keep.

def fetch_multi(symbols, period="20y", interval="1d"):
    return yf.download(
        symbols,
        period=period,
        interval=interval,
        group_by="ticker",
        auto_adjust=True,
        threads=True
    )

def fetch_recent(symbols, days=3):
    return yf.download(
        symbols,
        period=f"{days}d",
        interval="5m",
        group_by="ticker",
        threads=True
    )