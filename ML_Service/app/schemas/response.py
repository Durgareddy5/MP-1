from pydantic import BaseModel
from typing import Optional

class Prediction(BaseModel):
    symbol: str
    predicted_price: Optional[float]
    last_price: Optional[float]
    action: Optional[str]
    error: Optional[str]