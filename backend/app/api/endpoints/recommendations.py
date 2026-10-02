from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.entities import Recommendation, User, AuditLog
from backend.app.schemas.schemas import RecommendationResponse, RecommendationStatusUpdate
from backend.app.auth.rbac import get_current_user

router = APIRouter()

@router.get("", response_model=List[RecommendationResponse])
def get_recommendations(
    project_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(250, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation)
    if project_id:
        query = query.filter(Recommendation.project_id == project_id)
    if severity:
        query = query.filter(Recommendation.severity == severity.upper())
    if status:
        query = query.filter(Recommendation.status == status)
    if priority:
        query = query.filter(Recommendation.priority == priority.upper())

    return query.order_by(desc(Recommendation.created_at)).limit(limit).all()

@router.put("/{recommendation_id}/status", response_model=RecommendationResponse)
def update_recommendation_status(
    recommendation_id: int,
    status_update: RecommendationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(Recommendation.id == recommendation_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    old_status = rec.status
    rec.status = status_update.status

    audit = AuditLog(
        user_email=current_user.email,
        action="RECOMMENDATION_STATUS_UPDATED",
        entity_type="Recommendation",
        entity_id=str(rec.id),
        details=f"Project {rec.project_id}: status transitioned from '{old_status}' to '{rec.status}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(rec)
    return rec
