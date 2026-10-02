from fastapi import APIRouter
from typing import Dict, Any
from ml.predict import predict_project

router = APIRouter()

@router.post("")
def predict_acquisition_delay(project_data: Dict[str, Any]):
    """
    Stand-alone AI inference endpoint.
    Accepts project features and generates:
    - delay_probability (0-1)
    - risk_score (0-10)
    - risk_category (LOW, MEDIUM, HIGH, CRITICAL)
    - predicted_delay_days
    - confidence_score
    - stage_breakdown (9 statutory stages)
    - 30 / 60 / 90-day time-to-delay window analysis
    - Explainable AI feature attribution waterfall
    """
    result = predict_project(project_data)
    return result
