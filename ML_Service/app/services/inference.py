import numpy as np
import yfinance as yf

from app.core.loader import load_models
from app.core.config import SYMBOLS, SEQ_LENGTH
from app.data.data_cleaning import clean_ohlcv
from app.data.bhavcopy import fetch_bhavcopy_recent
from app.services.feature_engineering import add_features, LSTM_FEATURES, XGB_FEATURES

# Inference only needs enough recent history to warm up rolling features
# (longest window is the 50-day EMA) plus one 60-day sequence -- not the
# full 20y training history. "1y" gives a comfortable margin while
# keeping every prediction request fast.
INFERENCE_PERIOD = "1y"

# Sanity clamps on a prediction that's obviously broken (bad tick, model
# blew up, etc.) rather than a real forecast. Wider for the 5-day head
# since 5-trading-day returns are naturally larger-magnitude than 1-day.
MAX_SANE_RETURN_1D = 0.05
MAX_SANE_RETURN_5D = 0.15


def _fetch_recent(symbol: str):
    """yfinance first; if it comes back empty/too-thin, fall back to NSE
    bhavcopy (equities only -- index tickers like ^NSEI aren't in the
    bhavcopy equity file, so the fallback is a no-op for those and the
    symbol just reports 'No data' if yfinance also failed)."""
    df = yf.download(symbol, period=INFERENCE_PERIOD, interval="1d", auto_adjust=True)
    if not df.empty and len(df) >= SEQ_LENGTH + 30:
        return df

    if not symbol.startswith("^"):
        fallback = fetch_bhavcopy_recent(symbol, days=SEQ_LENGTH + 60)
        if not fallback.empty:
            return fallback

    return df  # possibly still empty/thin -- caller checks


def run_prediction():
    lstm_1d, lstm_5d, xgb_model, scaler = load_models()
    results = []

    for symbol in SYMBOLS:
        try:
            print(f"Processing {symbol}")

            df = _fetch_recent(symbol)
            if df.empty:
                results.append({"symbol": symbol, "error": "No data"})
                continue

            df = clean_ohlcv(df, symbol=symbol)
            if len(df) < SEQ_LENGTH:
                results.append({"symbol": symbol, "error": "Not enough data"})
                continue

            # Single shared feature computation — this must produce exactly
            # the same columns training used (see app.services.feature_engineering),
            # otherwise the model sees a distribution shift between train and serve.
            df = add_features(df)

            if len(df) < SEQ_LENGTH:
                results.append({"symbol": symbol, "error": "Not enough data after features"})
                continue

            # -------- LSTM (both horizons, same input window) --------
            features_lstm = df[LSTM_FEATURES].fillna(0)
            scaled = scaler.transform(features_lstm.values)
            scaled = np.clip(scaled, 0, 1)

            last_seq = scaled[-SEQ_LENGTH:]
            last_seq = np.reshape(last_seq, (1, SEQ_LENGTH, scaled.shape[1]))

            pred_return_1d = float(lstm_1d.predict(last_seq, verbose=0)[0][0])
            pred_return_5d = float(lstm_5d.predict(last_seq, verbose=0)[0][0])

            if abs(pred_return_1d) > MAX_SANE_RETURN_1D:
                pred_return_1d = 0.0
            if abs(pred_return_5d) > MAX_SANE_RETURN_5D:
                pred_return_5d = 0.0

            last_price = float(df["Close"].iloc[-1])
            predicted_price = last_price * (1 + pred_return_1d)
            predicted_price_5d = last_price * (1 + pred_return_5d)

            # -------- XGBoost --------
            xgb_features = df[XGB_FEATURES].fillna(0)
            xgb_input = xgb_features.iloc[-1].values.reshape(1, -1)
            action = int(xgb_model.predict(xgb_input)[0])

            action_map = {0: "SELL", 1: "HOLD", 2: "BUY"}

            results.append({
                "symbol": symbol,
                # unchanged fields — Server/web already depend on these exact names
                "predicted_price": round(predicted_price, 2),
                "last_price": round(last_price, 2),
                "action": action_map[action],
                # new, additive fields — old consumers ignore unknown keys
                "predicted_price_5d": round(predicted_price_5d, 2),
                "predicted_return_1d": round(pred_return_1d, 4),
                "predicted_return_5d": round(pred_return_5d, 4),
            })

        except Exception as e:
            results.append({
                "symbol": symbol,
                "error": str(e)
            })

    return results
