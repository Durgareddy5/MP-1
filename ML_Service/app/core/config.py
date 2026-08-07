SYMBOLS = [
    # Equities
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "ITC.NS",
    "BHARTIARTL.NS",
    "SBIN.NS",
    "WIPRO.NS",
    "SUNPHARMA.NS",
    "LT.NS",

    # Indices (Yahoo Finance)
    "^NSEI",        # NIFTY 50
    "^NSEBANK",    # NIFTY BANK
    "^BSESN",      # S&P BSE SENSEX
    "^INDIAVIX",   # INDIA VIX
    "^CNX100",     # NIFTY 100
    "^CRSLDX",     # NIFTY 500
    "^CNXIT",      # NIFTY IT
    "^CNXPHARMA",  # NIFTY PHARMA
    "^CNXAUTO",    # NIFTY AUTO
    "^CNXFMCG",    # NIFTY FMCG
    "^CNXMETAL",   # NIFTY METAL
    "^CNXREALTY",  # NIFTY REALTY
    "^CNXENERGY",  # NIFTY ENERGY
    "^CNXINFRA",   # NIFTY INFRA
    "^CNXPSUBANK", # NIFTY PSU BANK
    "^NSEMDCP50",  # NIFTY MIDCAP 50
    "^NSMIDCP",    # NIFTY NEXT 50
    "^CNXSC",      # NIFTY SMLCAP 100
]


SEQ_LENGTH = 60

MODEL_PATHS = {
    "lstm_1d": "saved_models/lstm_1d.keras",
    "lstm_5d": "saved_models/lstm_5d.keras",
    "xgb": "saved_models/xgb.json",
    "scaler": "saved_models/scaler.save"
}