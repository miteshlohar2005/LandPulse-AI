from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.entities import User, AuditLog, Project, ModelVersion, Alert
from backend.app.schemas.schemas import UserResponse, UserCreate, AuditLogResponse
from backend.app.auth.security import hash_password
from backend.app.auth.rbac import check_role, get_current_user

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    return db.query(User).order_by(User.id).all()

@router.post("/users", response_model=UserResponse)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        state=user_in.state,
        district=user_in.district,
        department=user_in.department,
        is_active=True
    )
    db.add(new_user)
    
    # Audit log
    audit = AuditLog(
        user_email=current_user.email,
        action="USER_CREATED",
        entity_type="User",
        entity_id=user_in.email,
        details=f"Created user with role {user_in.role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account")

    db.delete(user)
    db.add(AuditLog(
        user_email=current_user.email,
        action="USER_DELETED",
        entity_type="User",
        entity_id=str(user_id),
        details=f"User {user.email} removed"
    ))
    db.commit()
    return {"message": f"User {user.email} deleted successfully"}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["Administrator"]))
):
    return db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()

@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {
        "total_users": db.query(User).count(),
        "total_projects": db.query(Project).count(),
        "total_alerts": db.query(Alert).count(),
        "unacknowledged_alerts": db.query(Alert).filter(Alert.is_acknowledged == False).count(),
        "active_models": db.query(ModelVersion).filter(ModelVersion.is_active == True).count(),
        "audit_events": db.query(AuditLog).count(),
        "database_backend": "SQLite (Local Zero-Config Hackathon Mode)",
        "dataset_notice": "Demonstration Dataset - Predictions are for demonstration purposes and should not be used as official administrative decisions."
    }
