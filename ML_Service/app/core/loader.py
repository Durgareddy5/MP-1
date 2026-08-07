from tensorflow.keras.models import load_model
import xgboost as xgb
import joblib
from app.core.config import MODEL_PATHS

lstm_1d_model = None
lstm_5d_model = None
xgb_model = None
scaler = None

def load_models():
    global lstm_1d_model, lstm_5d_model, xgb_model, scaler

    if lstm_1d_model is None:
        lstm_1d_model = load_model(MODEL_PATHS["lstm_1d"], compile=False)

    if lstm_5d_model is None:
        lstm_5d_model = load_model(MODEL_PATHS["lstm_5d"], compile=False)

    if xgb_model is None:
        xgb_model = xgb.XGBClassifier()
        xgb_model.load_model(MODEL_PATHS["xgb"])

    if scaler is None:
        scaler = joblib.load(MODEL_PATHS["scaler"])

    return lstm_1d_model, lstm_5d_model, xgb_model, scaler
