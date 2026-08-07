import numpy as np
import joblib

SCALER_PATH = "saved_models/scaler.save"

def fit_scaler(data):
    from sklearn.preprocessing import MinMaxScaler
    scaler = MinMaxScaler()
    scaler.fit(data)
    joblib.dump(scaler, SCALER_PATH)
    return scaler

def load_scaler():
    return joblib.load(SCALER_PATH)

def transform(data, scaler):
    return scaler.transform(data)

def reshape_lstm(data):
    return np.reshape(data, (1, data.shape[0], 1))