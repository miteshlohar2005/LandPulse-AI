from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database.session import get_db
from backend.app.models.entities import ModelVersion, User
from backend.app.schemas.schemas import ModelVersionResponse
from backend.app.auth.rbac import get_current_user
from ml.model_manager import get_current_model_info, retrain_model_pipeline

router = APIRouter()

@router.get("/status")
def get_model_status(db: Session = Depends(get_db)):
    active_info = get_current_model_info(db)
    all_versions = db.query(ModelVersion).order_by(desc(ModelVersion.trained_at)).all()
    
    return {
        "active_model": active_info,
        "history": [
            {
                "id": v.id,
                "version": v.version,
                "algorithm": v.algorithm,
                "accuracy": v.accuracy,
                "precision": v.precision,
                "recall": v.recall,
                "f1_score": v.f1_score,
                "roc_auc": v.roc_auc,
                "confusion_matrix": v.confusion_matrix,
                "train_records_count": v.train_records_count,
                "is_active": v.is_active,
                "trained_at": v.trained_at,
                "notes": v.notes
            }
            for v in all_versions
        ]
    }

@router.post("/retrain")
def retrain_model(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = retrain_model_pipeline(db, user_email=current_user.email)
    return result
