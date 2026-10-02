from typing import Optional, List
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.entities import Alert, User, AuditLog
from backend.app.schemas.schemas import AlertResponse
from backend.app.auth.rbac import get_current_user

router = APIRouter()

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    limit: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if is_acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == is_acknowledged)

    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()
    return alerts

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.email
    alert.acknowledged_at = datetime.datetime.utcnow()

    audit = AuditLog(
        user_email=current_user.email,
        action="ALERT_ACKNOWLEDGED",
        entity_type="Alert",
        entity_id=str(alert.id),
        details=f"Alert for project {alert.project_id} marked acknowledged."
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return alert
