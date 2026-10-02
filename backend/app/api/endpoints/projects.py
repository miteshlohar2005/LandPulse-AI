from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from backend.app.database.session import get_db
from backend.app.models.entities import (
    Project, ProjectStage, Prediction, RiskFactor, Recommendation, Alert, AuditLog, Document, User
)
from backend.app.schemas.schemas import (
    ProjectListResponse, ProjectDetailResponse, ProjectCreate, ProjectUpdate, PredictionResponse
)
from backend.app.auth.rbac import get_current_user
from ml.predict import predict_project
from ml.recommendation_engine import generate_recommendations

router = APIRouter()

@router.get("", response_model=dict)
def get_projects(
    search: Optional[str] = Query(None, description="Search project name, ID, district or state"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    current_stage: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    sort_by: str = Query("id"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Project.id.ilike(search_fmt),
                Project.name.ilike(search_fmt),
                Project.state.ilike(search_fmt),
                Project.district.ilike(search_fmt),
                Project.project_type.ilike(search_fmt)
            )
        )

    if state:
        query = query.filter(Project.state == state)
    if district:
        query = query.filter(Project.district == district)
    if project_type:
        query = query.filter(Project.project_type == project_type)
    if current_stage:
        query = query.filter(Project.current_stage == current_stage)

    # Filter by risk category via join on latest prediction if requested
    if risk_category:
        query = query.join(Prediction).filter(Prediction.risk_category == risk_category.upper())

    total_count = query.count()

    # Sorting
    sort_col = getattr(Project, sort_by, Project.id)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    projects = query.offset((page - 1) * page_size).limit(page_size).all()

    # Build response with latest prediction attached
    items = []
    for p in projects:
        latest_pred = p.predictions[0] if p.predictions else None
        pred_dict = None
        if latest_pred:
            pred_dict = {
                "id": latest_pred.id,
                "project_id": latest_pred.project_id,
                "delay_probability": latest_pred.delay_probability,
                "risk_score": latest_pred.risk_score,
                "risk_category": latest_pred.risk_category,
                "predicted_delay_days": latest_pred.predicted_delay_days,
                "confidence_score": latest_pred.confidence_score,
                "risk_30d": latest_pred.risk_30d,
                "risk_60d": latest_pred.risk_60d,
                "risk_90d": latest_pred.risk_90d,
                "model_version": latest_pred.model_version,
                "created_at": latest_pred.created_at,
                "risk_factors": []
            }
        items.append({
            "id": p.id,
            "name": p.name,
            "state": p.state,
            "district": p.district,
            "project_type": p.project_type,
            "land_area_hectares": p.land_area_hectares,
            "affected_families": p.affected_families,
            "compensation_percentage": p.compensation_percentage,
            "legal_disputes_count": p.legal_disputes_count,
            "current_stage": p.current_stage,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "latest_prediction": pred_dict,
            "updated_at": p.updated_at
        })

    return {
        "items": items,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size
    }

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project_detail(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    latest_pred = p.predictions[0] if p.predictions else None

    return {
        "id": p.id,
        "name": p.name,
        "state": p.state,
        "district": p.district,
        "project_type": p.project_type,
        "land_area_hectares": p.land_area_hectares,
        "affected_families": p.affected_families,
        "compensation_budget_cr": p.compensation_budget_cr,
        "compensation_disbursed_cr": p.compensation_disbursed_cr,
        "compensation_percentage": p.compensation_percentage,
        "approval_delay_days": p.approval_delay_days,
        "legal_disputes_count": p.legal_disputes_count,
        "documentation_complete": p.documentation_complete,
        "notification_complete": p.notification_complete,
        "possession_percentage": p.possession_percentage,
        "rehabilitation_percentage": p.rehabilitation_percentage,
        "stakeholder_responsiveness": p.stakeholder_responsiveness,
        "historical_district_delay_score": p.historical_district_delay_score,
        "current_stage": p.current_stage,
        "start_date": p.start_date,
        "expected_completion_date": p.expected_completion_date,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "dataset_type": p.dataset_type,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "stages": p.stages,
        "latest_prediction": latest_pred,
        "recommendations": p.recommendations,
        "alerts": p.alerts,
        "documents": p.documents
    }

@router.put("/{project_id}", response_model=ProjectDetailResponse)
def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Capture previous state for audit log
    changes = []
    data_dict = update_data.dict(exclude_unset=True)

    for field, val in data_dict.items():
        old_val = getattr(p, field)
        if old_val != val:
            changes.append(f"{field}: {old_val} -> {val}")
            setattr(p, field, val)

    p.updated_at = datetime.datetime.utcnow()

    # Re-calculate compensation percentage if disbursed amount changed
    if "compensation_disbursed_cr" in data_dict and p.compensation_budget_cr > 0:
        p.compensation_percentage = round((p.compensation_disbursed_cr / p.compensation_budget_cr) * 100.0, 1)

    # --- Live Recalculation of AI Risk and Recommendations ---
    project_features = {
        "land_area_hectares": p.land_area_hectares,
        "affected_families": p.affected_families,
        "compensation_percentage": p.compensation_percentage,
        "approval_delay_days": p.approval_delay_days,
        "legal_disputes_count": p.legal_disputes_count,
        "documentation_complete": p.documentation_complete,
        "notification_complete": p.notification_complete,
        "possession_percentage": p.possession_percentage,
        "rehabilitation_percentage": p.rehabilitation_percentage,
        "historical_district_delay_score": p.historical_district_delay_score,
        "project_type": p.project_type,
        "current_stage": p.current_stage,
        "stakeholder_responsiveness": p.stakeholder_responsiveness,
        "state": p.state
    }

    pred_res = predict_project(project_features)

    # Create new prediction entry
    new_pred = Prediction(
        project_id=p.id,
        delay_probability=pred_res["delay_probability"],
        risk_score=pred_res["risk_score"],
        risk_category=pred_res["risk_category"],
        predicted_delay_days=pred_res["predicted_delay_days"],
        confidence_score=pred_res["confidence_score"],
        risk_30d=pred_res["risk_30d"],
        risk_60d=pred_res["risk_60d"],
        risk_90d=pred_res["risk_90d"],
        model_version=pred_res["model_version"],
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_pred)
    db.flush()

    # Add risk factors
    for f in pred_res["risk_factors"][:5]:
        rf = RiskFactor(
            prediction_id=new_pred.id,
            factor_name=f["factor_name"],
            impact_percentage=f["impact_percentage"],
            impact_direction=f["impact_direction"],
            category=f["category"]
        )
        db.add(rf)

    # Update stage risks
    if pred_res.get("stage_breakdown"):
        for sb in pred_res["stage_breakdown"]:
            existing_stage = db.query(ProjectStage).filter(
                ProjectStage.project_id == p.id,
                ProjectStage.stage_number == sb["stage_number"]
            ).first()
            if existing_stage:
                existing_stage.status = sb["status"]
                existing_stage.delay_probability = sb["delay_probability"]
                existing_stage.stage_risk = sb["stage_risk"]
                existing_stage.bottleneck = sb["bottleneck"]
                existing_stage.actual_duration_days = sb["actual_duration_days"]

    # Regenerate recommendations
    new_recs = generate_recommendations(project_features, pred_res["risk_category"])
    # Delete old recommendations and replace
    db.query(Recommendation).filter(Recommendation.project_id == p.id).delete()
    for r in new_recs[:4]:
        rec_entry = Recommendation(
            project_id=p.id,
            problem=r["problem"],
            severity=r["severity"],
            recommended_action=r["recommended_action"],
            responsible_department=r["responsible_department"],
            priority=r["priority"],
            expected_impact=r["expected_impact"],
            status="Open"
        )
        db.add(rec_entry)

    # Alert generation if critical risk
    if pred_res["delay_probability"] >= 0.70:
        alert = Alert(
            project_id=p.id,
            title="Updated Delay Risk Escalation",
            severity="CRITICAL" if pred_res["delay_probability"] >= 0.8 else "HIGH",
            message=f"Project {p.id} risk evaluated at {int(pred_res['delay_probability']*100)}% after status update.",
            trigger_reason="Recalculated risk threshold exceeded",
            recommended_action="Execute prioritized recommendations to unblock acquisition.",
            is_acknowledged=False
        )
        db.add(alert)

    # Audit logging
    audit = AuditLog(
        user_email=current_user.email,
        action="PROJECT_UPDATED",
        entity_type="Project",
        entity_id=p.id,
        details="; ".join(changes) if changes else "No attribute change recorded."
    )
    db.add(audit)
    db.commit()

    return get_project_detail(project_id, db)

@router.post("", response_model=ProjectDetailResponse)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Project).filter(Project.id == project_data.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project with ID {project_data.id} already exists")

    new_p = Project(**project_data.dict())
    db.add(new_p)
    db.commit()
    db.refresh(new_p)

    # Trigger ML prediction
    p_dict = project_data.dict()
    pred_res = predict_project(p_dict)
    
    pred = Prediction(
        project_id=new_p.id,
        delay_probability=pred_res["delay_probability"],
        risk_score=pred_res["risk_score"],
        risk_category=pred_res["risk_category"],
        predicted_delay_days=pred_res["predicted_delay_days"],
        confidence_score=pred_res["confidence_score"],
        risk_30d=pred_res["risk_30d"],
        risk_60d=pred_res["risk_60d"],
        risk_90d=pred_res["risk_90d"],
        model_version=pred_res["model_version"]
    )
    db.add(pred)
    db.flush()

    for f in pred_res["risk_factors"][:5]:
        db.add(RiskFactor(
            prediction_id=pred.id,
            factor_name=f["factor_name"],
            impact_percentage=f["impact_percentage"],
            impact_direction=f["impact_direction"],
            category=f["category"]
        ))

    # Audit log
    db.add(AuditLog(
        user_email=current_user.email,
        action="PROJECT_CREATED",
        entity_type="Project",
        entity_id=new_p.id,
        details=f"Project {new_p.name} created in {new_p.state}."
    ))
    db.commit()

    return get_project_detail(new_p.id, db)
