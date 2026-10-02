import os
import sys
import random
import datetime
import pandas as pd
import numpy as np

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.config import settings
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.entities import (
    User, Project, ProjectStage, ProjectUpdate, CompensationRecord,
    LegalCase, RehabilitationRecord, Document, Prediction, RiskFactor,
    Recommendation, Alert, ModelVersion, AuditLog
)
from backend.app.auth.security import hash_password
from ml.explain import explain_project_risk
from ml.recommendation_engine import generate_recommendations

random.seed(42)
np.random.seed(42)

STATES_DISTRICTS = {
    "Jharkhand": [
        {"district": "Ranchi", "lat": 23.3441, "lon": 85.3096, "hist_delay": 7.4},
        {"district": "Dhanbad", "lat": 23.7957, "lon": 86.4304, "hist_delay": 6.8},
        {"district": "East Singhbhum", "lat": 22.8046, "lon": 86.2029, "hist_delay": 6.5},
        {"district": "Bokaro", "lat": 23.6693, "lon": 86.1511, "hist_delay": 6.1},
        {"district": "Hazaribagh", "lat": 23.9937, "lon": 85.3623, "hist_delay": 5.9}
    ],
    "Maharashtra": [
        {"district": "Pune", "lat": 18.5204, "lon": 73.8567, "hist_delay": 4.5},
        {"district": "Nagpur", "lat": 21.1458, "lon": 79.0882, "hist_delay": 4.2},
        {"district": "Thane", "lat": 19.2183, "lon": 72.9781, "hist_delay": 6.9},
        {"district": "Nashik", "lat": 19.9975, "lon": 73.7898, "hist_delay": 5.1},
        {"district": "Aurangabad", "lat": 19.8762, "lon": 75.3433, "hist_delay": 5.5}
    ],
    "Uttar Pradesh": [
        {"district": "Lucknow", "lat": 26.8467, "lon": 80.9462, "hist_delay": 5.2},
        {"district": "Varanasi", "lat": 25.3176, "lon": 82.9739, "hist_delay": 5.8},
        {"district": "Gorakhpur", "lat": 26.7606, "lon": 83.3732, "hist_delay": 6.3},
        {"district": "Agra", "lat": 27.1767, "lon": 78.0081, "hist_delay": 5.7},
        {"district": "Kanpur", "lat": 26.4499, "lon": 80.3319, "hist_delay": 5.9}
    ],
    "Odisha": [
        {"district": "Bhubaneswar", "lat": 20.2961, "lon": 85.8245, "hist_delay": 4.8},
        {"district": "Sambalpur", "lat": 21.4669, "lon": 83.9812, "hist_delay": 6.4},
        {"district": "Sundargarh", "lat": 22.1197, "lon": 84.0378, "hist_delay": 7.1},
        {"district": "Jharsuguda", "lat": 21.8554, "lon": 84.0062, "hist_delay": 6.2},
        {"district": "Balasore", "lat": 21.4934, "lon": 86.9135, "hist_delay": 5.6}
    ],
    "Andhra Pradesh": [
        {"district": "Visakhapatnam", "lat": 17.6868, "lon": 83.2185, "hist_delay": 4.1},
        {"district": "Vijayawada", "lat": 16.5062, "lon": 80.6480, "hist_delay": 4.4},
        {"district": "Guntur", "lat": 16.3067, "lon": 80.4365, "hist_delay": 4.9},
        {"district": "Kurnool", "lat": 15.8281, "lon": 78.0373, "hist_delay": 5.2}
    ],
    "Tamil Nadu": [
        {"district": "Chennai", "lat": 13.0827, "lon": 80.2707, "hist_delay": 4.6},
        {"district": "Coimbatore", "lat": 11.0168, "lon": 76.9558, "hist_delay": 3.8},
        {"district": "Madurai", "lat": 9.9252, "lon": 78.1198, "hist_delay": 4.2},
        {"district": "Salem", "lat": 11.6643, "lon": 78.1460, "hist_delay": 4.0}
    ],
    "Gujarat": [
        {"district": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "hist_delay": 3.6},
        {"district": "Surat", "lat": 21.1702, "lon": 72.8311, "hist_delay": 3.5},
        {"district": "Vadodara", "lat": 22.3072, "lon": 73.1812, "hist_delay": 3.9},
        {"district": "Rajkot", "lat": 22.3039, "lon": 70.8022, "hist_delay": 4.1}
    ],
    "Madhya Pradesh": [
        {"district": "Bhopal", "lat": 23.2599, "lon": 77.4126, "hist_delay": 5.3},
        {"district": "Indore", "lat": 22.7196, "lon": 75.8577, "hist_delay": 4.3},
        {"district": "Jabalpur", "lat": 23.1815, "lon": 79.9864, "hist_delay": 5.8},
        {"district": "Gwalior", "lat": 26.2183, "lon": 78.1828, "hist_delay": 5.4}
    ]
}

PROJECT_TYPES = [
    "Highways & Expressways",
    "Railways & Dedicated Freight",
    "Mining & Coal Exploration",
    "Irrigation & Water Reservoirs",
    "Renewable Energy & Solar Parks",
    "Industrial Corridors & SEZ",
    "Urban Metros & Smart Cities"
]

STAGES = [
    {"num": 1, "name": "Preliminary Investigation", "exp_days": 45},
    {"num": 2, "name": "Notification (Sec 11)", "exp_days": 60},
    {"num": 3, "name": "Land Survey & Demarcation", "exp_days": 90},
    {"num": 4, "name": "Objection / Legal Hearing (Sec 15)", "exp_days": 60},
    {"num": 5, "name": "Compensation Assessment", "exp_days": 75},
    {"num": 6, "name": "Compensation Disbursement", "exp_days": 90},
    {"num": 7, "name": "Rehabilitation & Resettlement (R&R)", "exp_days": 120},
    {"num": 8, "name": "Possession (Sec 38)", "exp_days": 60},
    {"num": 9, "name": "Final Acquisition Complete", "exp_days": 30}
]

def generate_dataset_and_seed_db():
    print("Initializing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Create Default Users
    print("Creating default users...")
    demo_users = [
        User(
            email="admin@landguard.gov.in",
            hashed_password=hash_password("Admin@123"),
            full_name="Rajesh Sharma, IAS",
            role="Administrator",
            department="Department of Land Resources (DoLR), MoRD",
            is_active=True
        ),
        User(
            email="state.officer@landguard.gov.in",
            hashed_password=hash_password("State@123"),
            full_name="Dr. Anita Soren",
            role="State Officer",
            state="Jharkhand",
            department="Revenue & Land Reforms Department, Jharkhand",
            is_active=True
        ),
        User(
            email="district.officer@landguard.gov.in",
            hashed_password=hash_password("District@123"),
            full_name="Vikramaditya Verma",
            role="District Officer",
            state="Jharkhand",
            district="Ranchi",
            department="District Collectorate & Land Acquisition Office, Ranchi",
            is_active=True
        ),
        User(
            email="pm@landguard.gov.in",
            hashed_password=hash_password("Manager@123"),
            full_name="Sanjay Kulkarni",
            role="Project Manager",
            state="Jharkhand",
            district="Ranchi",
            department="National Highways Authority of India (NHAI)",
            is_active=True
        ),
        User(
            email="viewer@landguard.gov.in",
            hashed_password=hash_password("Viewer@123"),
            full_name="Pooja Sen",
            role="Viewer",
            department="NITI Aayog Infrastructure Monitoring Division",
            is_active=True
        )
    ]
    db.add_all(demo_users)
    db.commit()

    # 2. Build Flagship Project: LA-JH-2026-0042
    print("Creating Flagship Demo Project: LA-JH-2026-0042...")
    flagship = Project(
        id="LA-JH-2026-0042",
        name="Ranchi-Jamshedpur 4-Lane Industrial Expressway Corridor (NH-33 Extension)",
        state="Jharkhand",
        district="Ranchi",
        project_type="Highways & Expressways",
        land_area_hectares=450.0,
        affected_families=620,
        compensation_budget_cr=380.0,
        compensation_disbursed_cr=110.2,
        compensation_percentage=29.0, # Severely lagging
        approval_delay_days=68,       # Clearance backlog
        legal_disputes_count=4,       # Active court litigation
        documentation_complete=False, # Missing cadastral records
        notification_complete=True,
        possession_percentage=22.0,
        rehabilitation_percentage=18.0,
        stakeholder_responsiveness="Low",
        historical_district_delay_score=7.4,
        current_stage="Compensation Disbursement",
        start_date="2024-04-15",
        expected_completion_date="2026-11-30",
        latitude=23.3441,
        longitude=85.3096,
        dataset_type="Demonstration Dataset"
    )
    db.add(flagship)

    # 3. Generate 1,020+ realistic project records
    print("Generating 1,020 realistic demonstration project records...")
    csv_rows = []
    projects_list = [flagship]

    # Pre-add flagship to csv rows
    csv_rows.append({
        "project_id": flagship.id,
        "name": flagship.name,
        "state": flagship.state,
        "district": flagship.district,
        "project_type": flagship.project_type,
        "land_area_hectares": flagship.land_area_hectares,
        "affected_families": flagship.affected_families,
        "compensation_percentage": flagship.compensation_percentage,
        "approval_delay_days": flagship.approval_delay_days,
        "legal_disputes_count": flagship.legal_disputes_count,
        "documentation_complete": flagship.documentation_complete,
        "notification_complete": flagship.notification_complete,
        "possession_percentage": flagship.possession_percentage,
        "rehabilitation_percentage": flagship.rehabilitation_percentage,
        "stakeholder_responsiveness": flagship.stakeholder_responsiveness,
        "historical_district_delay_score": flagship.historical_district_delay_score,
        "current_stage": flagship.current_stage,
        "actual_delay_days": 74,
        "delayed_flag": 1
    })

    project_counter = 43
    states_keys = list(STATES_DISTRICTS.keys())

    for i in range(1020):
        state = random.choice(states_keys)
        dist_info = random.choice(STATES_DISTRICTS[state])
        district = dist_info["district"]
        base_lat = dist_info["lat"] + random.uniform(-0.15, 0.15)
        base_lon = dist_info["lon"] + random.uniform(-0.15, 0.15)
        hist_delay = dist_info["hist_delay"] + random.uniform(-0.5, 0.5)

        proj_type = random.choice(PROJECT_TYPES)
        stage_obj = random.choice(STAGES)
        stage_name = stage_obj["name"]
        stage_num = stage_obj["num"]

        area = round(random.uniform(25.0, 1200.0), 1)
        # Higher density in urban/expressways
        density_factor = random.uniform(0.5, 2.5)
        families = int(area * density_factor)

        budget_cr = round(area * random.uniform(0.4, 1.2), 1)

        # Realistic internal consistency:
        # If in early stage, compensation & possession are naturally lower
        if stage_num <= 3:
            comp_pct = round(random.uniform(0.0, 15.0), 1)
            possession_pct = 0.0
            rehab_pct = 0.0
            doc_complete = random.choice([True, False, False])
            notification_complete = (stage_num >= 2)
            disputes = random.choice([0, 0, 1, 2])
            approval_delay = random.randint(0, 45)
        elif stage_num in [4, 5]:
            comp_pct = round(random.uniform(10.0, 45.0), 1)
            possession_pct = round(random.uniform(0.0, 15.0), 1)
            rehab_pct = round(random.uniform(0.0, 20.0), 1)
            doc_complete = random.choice([True, True, False])
            notification_complete = True
            disputes = random.choice([0, 1, 2, 3, 4])
            approval_delay = random.randint(5, 75)
        elif stage_num in [6, 7]:
            comp_pct = round(random.uniform(25.0, 90.0), 1)
            possession_pct = round(random.uniform(10.0, 50.0), 1)
            rehab_pct = round(random.uniform(15.0, 65.0), 1)
            doc_complete = random.choice([True, True, True, False])
            notification_complete = True
            disputes = random.choice([0, 1, 2, 3, 5])
            approval_delay = random.randint(10, 90)
        else: # Stage 8, 9
            comp_pct = round(random.uniform(70.0, 100.0), 1)
            possession_pct = round(random.uniform(60.0, 100.0), 1)
            rehab_pct = round(random.uniform(50.0, 100.0), 1)
            doc_complete = True
            notification_complete = True
            disputes = random.choice([0, 0, 1])
            approval_delay = random.randint(0, 30)

        stakeholder = random.choice(["Low", "Medium", "Medium", "High", "High"])
        disbursed_cr = round(budget_cr * (comp_pct / 100.0), 1)

        # Ground-truth delay calculation based on real RFCTLARR Act factors
        delay_score = (
            (100 - comp_pct) * 0.35 +
            disputes * 14.0 +
            approval_delay * 0.35 +
            (15.0 if not doc_complete else -5.0) +
            (12.0 if stakeholder == "Low" else -8.0 if stakeholder == "High" else 0.0) +
            (hist_delay - 5.0) * 4.0
        )
        # Probability between 0.05 and 0.98
        prob = 1.0 / (1.0 + np.exp(-(delay_score - 45.0) / 15.0))
        delayed_flag = 1 if prob >= 0.50 else 0
        actual_delay_days = int(max(0, (prob * 110) + (approval_delay * 0.5) - random.uniform(5, 20)))

        state_code = state[:2].upper()
        p_id = f"LA-{state_code}-2026-{project_counter:04d}"
        project_counter += 1

        name_types = {
            "Highways & Expressways": f"{district} Bypass 6-Lane Expressway Expansion",
            "Railways & Dedicated Freight": f"{district} Dedicated Freight Rail Freight Corridor & Terminal",
            "Mining & Coal Exploration": f"{district} Block-IV Mineral Extraction & Processing Node",
            "Irrigation & Water Reservoirs": f"{district} Multi-Village Barrage & Micro-Irrigation Canal",
            "Renewable Energy & Solar Parks": f"{district} Ultra-Mega 500MW Solar Photovoltaic Park",
            "Industrial Corridors & SEZ": f"{district} Multimodal Logistics Hub & Industrial Township",
            "Urban Metros & Smart Cities": f"{district} Ring-Rail & Transit Oriented Development"
        }
        proj_name = name_types.get(proj_type, f"{district} Infrastructure Project")

        proj_obj = Project(
            id=p_id,
            name=proj_name,
            state=state,
            district=district,
            project_type=proj_type,
            land_area_hectares=area,
            affected_families=families,
            compensation_budget_cr=budget_cr,
            compensation_disbursed_cr=disbursed_cr,
            compensation_percentage=comp_pct,
            approval_delay_days=approval_delay,
            legal_disputes_count=disputes,
            documentation_complete=doc_complete,
            notification_complete=notification_complete,
            possession_percentage=possession_pct,
            rehabilitation_percentage=rehab_pct,
            stakeholder_responsiveness=stakeholder,
            historical_district_delay_score=round(hist_delay, 1),
            current_stage=stage_name,
            start_date="2024-01-10",
            expected_completion_date="2027-03-31",
            latitude=round(base_lat, 4),
            longitude=round(base_lon, 4),
            dataset_type="Demonstration Dataset"
        )
        projects_list.append(proj_obj)

        csv_rows.append({
            "project_id": p_id,
            "name": proj_name,
            "state": state,
            "district": district,
            "project_type": proj_type,
            "land_area_hectares": area,
            "affected_families": families,
            "compensation_percentage": comp_pct,
            "approval_delay_days": approval_delay,
            "legal_disputes_count": disputes,
            "documentation_complete": doc_complete,
            "notification_complete": notification_complete,
            "possession_percentage": possession_pct,
            "rehabilitation_percentage": rehab_pct,
            "stakeholder_responsiveness": stakeholder,
            "historical_district_delay_score": round(hist_delay, 1),
            "current_stage": stage_name,
            "actual_delay_days": actual_delay_days,
            "delayed_flag": delayed_flag
        })

    # Add projects to DB in chunks
    print("Saving projects to database...")
    db.add_all(projects_list[1:]) # flagship was already added
    db.commit()

    # Save CSV file for ML pipeline
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    csv_path = os.path.join(settings.DATA_DIR, "demo_projects.csv")
    df = pd.DataFrame(csv_rows)
    df.to_csv(csv_path, index=False)
    print(f"Exported {len(df)} records to: {csv_path}")

    # 4. Generate Associated Records (Stages, Predictions, Recommendations, Alerts, Documents, etc.)
    print("Generating acquisition stages, predictions, XAI attributions, and alerts...")
    
    # We populate detail relations for all projects (with rich records for top 200 to keep seed snappy)
    for idx, p in enumerate(projects_list):
        # Calculate risk heuristics for seeding
        comp_pct = p.compensation_percentage
        disputes = p.legal_disputes_count
        approval_days = p.approval_delay_days
        stakeholder = p.stakeholder_responsiveness

        # Special calibration for flagship project LA-JH-2026-0042
        if p.id == "LA-JH-2026-0042":
            delay_prob = 0.84
            risk_score = 8.4
            risk_cat = "HIGH"
            pred_delay = 68
            conf = 0.89
        else:
            raw_val = (
                (100 - comp_pct) * 0.35 +
                disputes * 14.0 +
                approval_days * 0.35 +
                (15.0 if not p.documentation_complete else -5.0) +
                (12.0 if stakeholder == "Low" else -8.0 if stakeholder == "High" else 0.0) +
                (p.historical_district_delay_score - 5.0) * 4.0
            )
            delay_prob = float(round(1.0 / (1.0 + np.exp(-(raw_val - 45.0) / 15.0)), 2))
            risk_score = round(delay_prob * 10.0, 1)
            if risk_score >= 8.0:
                risk_cat = "CRITICAL"
            elif risk_score >= 6.0:
                risk_cat = "HIGH"
            elif risk_score >= 3.5:
                risk_cat = "MEDIUM"
            else:
                risk_cat = "LOW"
            pred_delay = int(delay_prob * 80 + approval_days * 0.3)
            conf = round(random.uniform(0.82, 0.94), 2)

        # 9 Stages
        for s in STAGES:
            s_num = s["num"]
            s_name = s["name"]
            exp_d = s["exp_days"]

            curr_num = 1
            for st in STAGES:
                if st["name"].lower() in p.current_stage.lower():
                    curr_num = st["num"]
                    break

            if s_num < curr_num:
                status = "Completed"
                prob_s = 0.05
                stage_risk = 5.0
                bottleneck = "Resolved"
                act_d = exp_d
            elif s_num == curr_num:
                status = "Delayed" if delay_prob > 0.75 else "At Risk" if delay_prob > 0.50 else "In Progress"
                prob_s = delay_prob
                stage_risk = round(delay_prob * 100, 1)
                act_d = exp_d + int(approval_days * 0.7)
                if "Compensation" in s_name:
                    bottleneck = f"Pending disbursement ({p.compensation_percentage:.0f}% released)"
                elif "Legal" in s_name or "Objection" in s_name:
                    bottleneck = f"{p.legal_disputes_count} title objections in court"
                elif "Possession" in s_name:
                    bottleneck = f"Physical handover lag ({p.possession_percentage:.0f}% possession)"
                elif "Rehabilitation" in s_name:
                    bottleneck = f"R&R colony infrastructure ({p.rehabilitation_percentage:.0f}% ready)"
                else:
                    bottleneck = "Clearance backlog" if approval_days > 30 else "On Track"
            else:
                status = "Pending"
                prob_s = round(delay_prob * 0.8, 2)
                stage_risk = round(prob_s * 100, 1)
                act_d = 0
                bottleneck = "Anticipated downstream risk" if delay_prob > 0.6 else "None"

            stage_entry = ProjectStage(
                project_id=p.id,
                stage_number=s_num,
                stage_name=s_name,
                expected_duration_days=exp_d,
                actual_duration_days=act_d,
                status=status,
                delay_probability=prob_s,
                stage_risk=stage_risk,
                bottleneck=bottleneck
            )
            db.add(stage_entry)

        # Prediction record
        pred = Prediction(
            project_id=p.id,
            delay_probability=delay_prob,
            risk_score=risk_score,
            risk_category=risk_cat,
            predicted_delay_days=pred_delay,
            confidence_score=conf,
            risk_30d=round(delay_prob * 0.45, 2),
            risk_60d=round(delay_prob * 0.78, 2),
            risk_90d=round(min(delay_prob * 1.15, 0.99), 2),
            model_version="v1.0.0-rf"
        )
        db.add(pred)
        db.flush()

        # Risk factors (XAI)
        p_dict = {
            "compensation_percentage": p.compensation_percentage,
            "legal_disputes_count": p.legal_disputes_count,
            "approval_delay_days": p.approval_delay_days,
            "documentation_complete": p.documentation_complete,
            "stakeholder_responsiveness": p.stakeholder_responsiveness,
            "historical_district_delay_score": p.historical_district_delay_score,
            "affected_families": p.affected_families,
            "land_area_hectares": p.land_area_hectares
        }
        factors = explain_project_risk(p_dict)
        for f in factors[:5]:
            rf_entry = RiskFactor(
                prediction_id=pred.id,
                factor_name=f["factor_name"],
                impact_percentage=f["impact_percentage"],
                impact_direction=f["impact_direction"],
                category=f["category"]
            )
            db.add(rf_entry)

        # Recommendations
        recs = generate_recommendations(p_dict, risk_cat)
        for r in recs[:4]:
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

        # Trigger alerts for high and critical projects
        if delay_prob >= 0.70 or p.id == "LA-JH-2026-0042":
            alert_entry = Alert(
                project_id=p.id,
                title="Critical Acquisition Delay Alert" if delay_prob >= 0.8 else "High Risk Delay Warning",
                severity="CRITICAL" if delay_prob >= 0.8 else "HIGH",
                message=f"Project {p.id} ({p.name}) delay probability escalated to {int(delay_prob*100)}%. Predicted additional delay: {pred_delay} days.",
                trigger_reason="Compensation disbursement backlog & legal dispute escalation" if p.compensation_percentage < 40 else "Approval timeline exceeded statutory limits",
                recommended_action="Convene urgent review with District Collector and Land Acquisition Officer.",
                is_acknowledged=False
            )
            db.add(alert_entry)

        # Documents
        doc_categories = [
            ("Section 4(1) Preliminary Gazette Notification.pdf", "Section 4(1) Notification", 240, True),
            ("Social Impact Assessment (SIA) Final Report.pdf", "SIA Report", 1450, True),
            ("Section 19 Declaration & RoR Verification.pdf", "Section 19 Declaration", 820, p.documentation_complete),
            ("Award Statement & Village Compensation Matrix.xlsx", "Award Sheet", 510, p.compensation_percentage > 50)
        ]
        for d_name, d_cat, d_size, d_ver in doc_categories:
            doc_entry = Document(
                project_id=p.id,
                document_name=d_name,
                category=d_cat,
                file_type="PDF" if "pdf" in d_name else "Excel",
                file_size_kb=d_size,
                file_path=f"/uploads/{p.id}/{d_name}",
                verified=d_ver
            )
            db.add(doc_entry)

        # Commit in batches of 100
        if idx % 100 == 0:
            db.commit()
            print(f"Processed {idx} / {len(projects_list)} projects...")

    # 5. Model Version record
    print("Registering base model version...")
    m_version = ModelVersion(
        version="v1.0.0-rf",
        algorithm="Random Forest Classifier (Ensemble)",
        accuracy=0.892,
        precision=0.874,
        recall=0.915,
        f1_score=0.894,
        roc_auc=0.941,
        confusion_matrix=[[98, 12], [9, 101]],
        train_records_count=1021,
        is_active=True,
        trained_at=datetime.datetime.utcnow(),
        notes="Pre-trained demonstration ensemble model trained on RFCTLARR Act acquisition features."
    )
    db.add(m_version)

    # 6. Audit Log Initial Records
    init_audit = AuditLog(
        user_email="admin@landguard.gov.in",
        action="SYSTEM_INITIALIZED",
        entity_type="Database",
        entity_id="ALL",
        details="1,021 demonstration land acquisition project records, statutory stages, and model registry initialized."
    )
    db.add(init_audit)
    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    generate_dataset_and_seed_db()
