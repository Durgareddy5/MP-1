import xgboost as xgb

def load_xgb(path):
    model = xgb.XGBClassifier()
    model.load_model(path)
    return model