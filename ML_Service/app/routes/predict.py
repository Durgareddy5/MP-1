from fastapi import APIRouter
from app.services.inference import run_prediction

router = APIRouter()

@router.get("/predict")
def predict():
    return {
        "success": True,
        "data": run_prediction()
    }