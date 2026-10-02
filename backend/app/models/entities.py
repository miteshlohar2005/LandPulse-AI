import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # Administrator, State Officer, District Officer, Project Manager, Viewer
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    department = Column(String(100), default="Department of Land Resources")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="user")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(50), primary_key=True, index=True) # e.g. LA-JH-2026-0042
    name = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    project_type = Column(String(100), nullable=False, index=True) # Highways, Railways, Mining, Irrigation, Urban, Energy, Industrial
    land_area_hectares = Column(Float, nullable=False)
    affected_families = Column(Integer, nullable=False)
    compensation_budget_cr = Column(Float, default=0.0) # in Crores INR
    compensation_disbursed_cr = Column(Float, default=0.0)
    compensation_percentage = Column(Float, default=0.0)
    approval_delay_days = Column(Integer, default=0)
    legal_disputes_count = Column(Integer, default=0)
    documentation_complete = Column(Boolean, default=False)
    notification_complete = Column(Boolean, default=False)
    possession_percentage = Column(Float, default=0.0)
    rehabilitation_percentage = Column(Float, default=0.0)
    stakeholder_responsiveness = Column(String(20), default="Medium") # High, Medium, Low
    historical_district_delay_score = Column(Float, default=5.0) # 1-10
    current_stage = Column(String(100), nullable=False)
    start_date = Column(String(50), nullable=True)
    expected_completion_date = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    dataset_type = Column(String(50), default="Demonstration Dataset")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    stages = relationship("ProjectStage", back_populates="project", cascade="all, delete-orphan")
    updates = relationship("ProjectUpdate", back_populates="project", cascade="all, delete-orphan")
    compensation_records = relationship("CompensationRecord", back_populates="project", cascade="all, delete-orphan")
    legal_cases = relationship("LegalCase", back_populates="project", cascade="all, delete-orphan")
    rehabilitation_records = relationship("RehabilitationRecord", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="project", cascade="all, delete-orphan", order_by="desc(Prediction.created_at)")
    recommendations = relationship("Recommendation", back_populates="project", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="project", cascade="all, delete-orphan")


class ProjectStage(Base):
    __tablename__ = "project_stages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    stage_number = Column(Integer, nullable=False)
    stage_name = Column(String(100), nullable=False)
    expected_duration_days = Column(Integer, default=60)
    actual_duration_days = Column(Integer, default=0)
    status = Column(String(50), default="Pending") # Completed, In Progress, Delayed, At Risk, Pending
    delay_probability = Column(Float, default=0.0)
    stage_risk = Column(Float, default=0.0) # 0-100%
    bottleneck = Column(String(255), default="None")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="stages")


class ProjectUpdate(Base):
    __tablename__ = "project_updates"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    update_date = Column(DateTime, default=datetime.datetime.utcnow)
    stage = Column(String(100), nullable=False)
    summary = Column(String(500), nullable=False)
    updated_by = Column(String(100), default="System")

    project = relationship("Project", back_populates="updates")


class CompensationRecord(Base):
    __tablename__ = "compensation_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    village_cluster = Column(String(150), nullable=False)
    total_beneficiaries = Column(Integer, default=0)
    paid_beneficiaries = Column(Integer, default=0)
    total_amount_cr = Column(Float, default=0.0)
    disbursed_amount_cr = Column(Float, default=0.0)
    disputed_amount_cr = Column(Float, default=0.0)
    status = Column(String(50), default="In Progress") # Completed, Pending, In Progress, Disputed

    project = relationship("Project", back_populates="compensation_records")


class LegalCase(Base):
    __tablename__ = "legal_cases"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    case_number = Column(String(100), nullable=False)
    court_tier = Column(String(100), nullable=False) # High Court, District Court, Land Acquisition Authority
    dispute_type = Column(String(150), nullable=False) # Ownership Title, Compensation Amount, Forest/Tribal Rights
    status = Column(String(50), default="Active") # Active, Resolved, Stay Granted, Hearing Scheduled
    next_hearing_date = Column(String(50), nullable=True)
    stay_granted = Column(Boolean, default=False)

    project = relationship("Project", back_populates="legal_cases")


class RehabilitationRecord(Base):
    __tablename__ = "rehabilitation_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    total_families_eligible = Column(Integer, default=0)
    housing_units_allotted = Column(Integer, default=0)
    livelihood_grants_disbursed = Column(Integer, default=0)
    rr_colony_possession_pct = Column(Float, default=0.0)
    status = Column(String(50), default="In Progress")

    project = relationship("Project", back_populates="rehabilitation_records")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    document_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # Section 4(1) Notification, SIA Report, Joint Inspection, Award Sheet
    file_type = Column(String(20), default="PDF")
    file_size_kb = Column(Integer, default=100)
    file_path = Column(String(500), nullable=True)
    verified = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="documents")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    delay_probability = Column(Float, nullable=False) # e.g. 0.84 (84%)
    risk_score = Column(Float, nullable=False) # e.g. 8.4 / 10
    risk_category = Column(String(20), nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    predicted_delay_days = Column(Integer, nullable=False) # e.g. 68 days
    confidence_score = Column(Float, default=0.88) # e.g. 88%
    risk_30d = Column(Float, default=0.0) # 30-day time-to-delay risk
    risk_60d = Column(Float, default=0.0) # 60-day time-to-delay risk
    risk_90d = Column(Float, default=0.0) # 90-day time-to-delay risk
    model_version = Column(String(50), default="v1.0.0-rf")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="predictions")
    risk_factors = relationship("RiskFactor", back_populates="prediction", cascade="all, delete-orphan")


class RiskFactor(Base):
    __tablename__ = "risk_factors"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False, index=True)
    factor_name = Column(String(255), nullable=False)
    impact_percentage = Column(Float, nullable=False) # e.g. +27.0 or -6.0
    impact_direction = Column(String(10), default="positive") # positive = increases delay risk, negative = mitigates risk
    category = Column(String(100), default="Financial") # Compensation, Legal, Approvals, Documentation, Stakeholder, Geographic

    prediction = relationship("Prediction", back_populates="risk_factors")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    problem = Column(String(255), nullable=False)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    recommended_action = Column(Text, nullable=False)
    responsible_department = Column(String(150), nullable=False)
    priority = Column(String(20), default="P1") # P1, P2, P3
    expected_impact = Column(String(255), nullable=False)
    status = Column(String(50), default="Open") # Open, In Progress, Implemented, Dismissed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="recommendations")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    message = Column(Text, nullable=False)
    trigger_reason = Column(String(255), nullable=False)
    recommended_action = Column(String(255), nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="alerts")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(50), unique=True, nullable=False) # e.g. v1.0.0-rf
    algorithm = Column(String(100), nullable=False) # Random Forest, Gradient Boosting, Logistic Regression
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    confusion_matrix = Column(JSON, nullable=True)
    train_records_count = Column(Integer, default=1000)
    is_active = Column(Boolean, default=False)
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String(500), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), default="system@landguard.gov.in")
    action = Column(String(100), nullable=False) # e.g. PROJECT_UPDATE, PREDICTION_GENERATED, MODEL_RETRAINED
    entity_type = Column(String(50), nullable=False) # Project, Model, Alert, User
    entity_id = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class SupportTicket(Base):
    """User support requests submitted through the Helpline & Support Center."""
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. #LG-2026-0001
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    category = Column(String(100), nullable=False, index=True)  # Land Records, Property Ownership, etc.
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Request Received", index=True)
    # Statuses: Request Received, Under Review, Support Team Assigned,
    #           Additional Information Required, Resolved, Closed
    admin_response = Column(Text, nullable=True)
    assigned_to = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SupportConfig(Base):
    """Singleton table for admin-configurable support contact information."""
    __tablename__ = "support_config"

    id = Column(Integer, primary_key=True, default=1)
    support_phone = Column(String(20), default="+91 XXXXX XXXXX")
    support_email = Column(String(255), default="support@landguard.ai")
    support_hours = Column(String(255), default="Monday–Saturday | 9:00 AM–6:00 PM")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
