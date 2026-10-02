from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.entities import Project, Prediction

router = APIRouter()

@router.get("/projects")
def get_map_projects(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    current_stage: Optional[str] = Query(None),
    limit: int = Query(2000, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    """
    Returns lightweight GIS map features optimized for Leaflet / OpenStreetMap rendering.
    """
    query = db.query(Project)

    if state:
        query = query.filter(Project.state == state)
    if district:
        query = query.filter(Project.district == district)
    if project_type:
        query = query.filter(Project.project_type == project_type)
    if current_stage:
        query = query.filter(Project.current_stage == current_stage)

    projects = query.limit(limit).all()

    features = []
    for p in projects:
        latest_pred = p.predictions[0] if p.predictions else None
        if latest_pred:
            r_cat = latest_pred.risk_category
            r_score = latest_pred.risk_score
            r_prob = latest_pred.delay_probability
            r_delay = latest_pred.predicted_delay_days
        else:
            r_cat = "LOW"
            r_score = 3.0
            r_prob = 0.3
            r_delay = 15

        if risk_category and r_cat != risk_category.upper():
            continue

        features.append({
            "id": p.id,
            "name": p.name,
            "state": p.state,
            "district": p.district,
            "project_type": p.project_type,
            "current_stage": p.current_stage,
            "land_area_hectares": p.land_area_hectares,
            "compensation_percentage": p.compensation_percentage,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "risk_score": r_score,
            "delay_probability": r_prob,
            "risk_category": r_cat,
            "predicted_delay_days": r_delay
        })

    return {
        "type": "FeatureCollection",
        "count": len(features),
        "features": features
    }
