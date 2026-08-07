"""
DEPRECATED - do not run this.

This used to fit a MinMaxScaler on Close price alone and save it to
saved_models/scaler.save. train_lstm.py now fits the scaler itself, on
the full LSTM_FEATURES set (returns, ema_20, ema_50, vol_change, rsi_14,
macd_hist), TRAINING DATA ONLY, and saves it alongside the model. Running
this script would silently overwrite that with an incompatible
single-feature scaler and break inference.py (which expects a
6-feature transform).

Just run `python train_lstm.py` -- it handles the scaler for you.
"""
raise SystemExit(
    "train_scaler.py is deprecated. The scaler is now fit inside train_lstm.py "
    "on the full multi-feature set; running this script would overwrite it with "
    "an incompatible single-feature scaler. Run `python train_lstm.py` instead."
)
