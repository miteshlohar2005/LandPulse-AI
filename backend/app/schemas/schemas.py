from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    state: Optional[str] = None
    district: Optional[str] = None
    department: Optional[str] = "Department of Land Resources"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    state: Optional[str] = None
    district: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Stage Schemas ---
class StageBase(BaseModel):
    stage_number: int
    stage_name: str
    expected_duration_days: int
    actual_duration_days: int
    status: str
    delay_probability: float
    stage_risk: float
    bottleneck: str

class StageResponse(StageBase):
    id: int
    project_id: str
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Prediction & XAI Schemas ---
class RiskFactorResponse(BaseModel):
    id: Optional[int] = None
    factor_name: str
    impact_percentage: float
    impact_direction: str
    category: str

    model_config = ConfigDict(from_attributes=True)

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    project_id: str
    delay_probability: float
    risk_score: float
    risk_category: str
    predicted_delay_days: int
    confidence_score: float
    risk_30d: float
    risk_60d: float
    risk_90d: float
    model_version: str
    created_at: Optional[datetime] = None
    risk_factors: List[RiskFactorResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Recommendation Schemas ---
class RecommendationResponse(BaseModel):
    id: int
    project_id: str
    problem: str
    severity: str
    recommended_action: str
    responsible_department: str
    priority: str
    expected_impact: str
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RecommendationStatusUpdate(BaseModel):
    status: str # Open, In Progress, Implemented, Dismissed


# --- Alert Schemas ---
class AlertResponse(BaseModel):
    id: int
    project_id: str
    title: str
    severity: str
    message: str
    trigger_reason: str
    recommended_action: Optional[str] = None
    is_acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: int
    project_id: str
    document_name: str
    category: str
    file_type: str
    file_size_kb: int
    verified: bool
    uploaded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Project Schemas ---
class ProjectBase(BaseModel):
    id: str
    name: str
    state: str
    district: str
    project_type: str
    land_area_hectares: float
    affected_families: int
    compensation_budget_cr: float
    compensation_disbursed_cr: float
    compensation_percentage: float
    approval_delay_days: int
    legal_disputes_count: int
    documentation_complete: bool
    notification_complete: bool
    possession_percentage: float
    rehabilitation_percentage: float
    stakeholder_responsiveness: str
    historical_district_delay_score: float
    current_stage: str
    start_date: Optional[str] = None
    expected_completion_date: Optional[str] = None
    latitude: float
    longitude: float

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    compensation_disbursed_cr: Optional[float] = None
    compensation_percentage: Optional[float] = None
    approval_delay_days: Optional[int] = None
    legal_disputes_count: Optional[int] = None
    documentation_complete: Optional[bool] = None
    notification_complete: Optional[bool] = None
    possession_percentage: Optional[float] = None
    rehabilitation_percentage: Optional[float] = None
    stakeholder_responsiveness: Optional[str] = None
    current_stage: Optional[str] = None
    expected_completion_date: Optional[str] = None

class ProjectListResponse(BaseModel):
    id: str
    name: str
    state: str
    district: str
    project_type: str
    land_area_hectares: float
    affected_families: int
    compensation_percentage: float
    legal_disputes_count: int
    current_stage: str
    latitude: float
    longitude: float
    latest_prediction: Optional[PredictionResponse] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ProjectDetailResponse(ProjectBase):
    dataset_type: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stages: List[StageResponse] = []
    latest_prediction: Optional[PredictionResponse] = None
    recommendations: List[RecommendationResponse] = []
    alerts: List[AlertResponse] = []
    documents: List[DocumentResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard KPI Schemas ---
class KPISummary(BaseModel):
    total_projects: int
    critical_risk_projects: int
    high_risk_projects: int
    medium_risk_projects: int
    low_risk_projects: int
    average_delay_probability: float
    projects_requiring_action: int
    total_land_area_hectares: float
    total_affected_families: int
    total_compensation_budget_cr: float
    total_compensation_disbursed_cr: float

class StateRiskStat(BaseModel):
    state: str
    total_projects: int
    avg_delay_prob: float
    high_risk_count: int
    critical_risk_count: int

class DistrictTrendStat(BaseModel):
    district: str
    state: str
    avg_delay_days: int
    project_count: int
    risk_score: float

class TopDelayFactorStat(BaseModel):
    factor: str
    affected_projects_pct: float
    avg_impact_pct: float

class DashboardResponse(BaseModel):
    kpis: KPISummary
    state_distribution: List[StateRiskStat]
    district_trends: List[DistrictTrendStat]
    risk_donut: Dict[str, int]
    top_delay_factors: List[TopDelayFactorStat]
    stage_bottlenecks: Dict[str, Dict[str, Any]]
    monthly_trend: List[Dict[str, Any]]


# --- Model Management Schemas ---
class ModelVersionResponse(BaseModel):
    id: int
    version: str
    algorithm: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: Optional[Dict[str, Any]] = None
    train_records_count: int
    is_active: bool
    trained_at: datetime
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class RetrainResponse(BaseModel):
    message: str
    previous_model: str
    new_model: ModelVersionResponse
    comparison: Dict[str, Any]


# --- Audit Log Schema ---
class AuditLogResponse(BaseModel):
    id: int
    user_email: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
