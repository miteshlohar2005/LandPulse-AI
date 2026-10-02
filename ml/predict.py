import os
import sys
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.config import settings
from ml.data_loader import FEATURE_COLUMNS
from ml.explain import explain_project_risk

_CACHED_BUNDLE = None

def load_active_bundle():
    global _CACHED_BUNDLE
    model_path = os.path.join(settings.MODEL_DIR, "active_model.joblib")
    if os.path.exists(model_path):
        _CACHED_BUNDLE = joblib.load(model_path)
    return _CACHED_BUNDLE

def reload_active_bundle():
    global _CACHED_BUNDLE
    _CACHED_BUNDLE = None
    return load_active_bundle()

STATUTORY_STAGES = [
    {"number": 1, "name": "Preliminary Investigation", "expected_days": 45},
    {"number": 2, "name": "Notification (Sec 11)", "expected_days": 60},
    {"number": 3, "name": "Land Survey & Demarcation", "expected_days": 90},
    {"number": 4, "name": "Objection / Legal Hearing (Sec 15)", "expected_days": 60},
    {"number": 5, "name": "Compensation Assessment", "expected_days": 75},
    {"number": 6, "name": "Compensation Disbursement", "expected_days": 90},
    {"number": 7, "name": "Rehabilitation & Resettlement (R&R)", "expected_days": 120},
    {"number": 8, "name": "Possession (Sec 38)", "expected_days": 60},
    {"number": 9, "name": "Final Acquisition Complete", "expected_days": 30}
]

def calculate_stage_wise_risk(project_dict: Dict[str, Any], overall_delay_prob: float) -> List[Dict[str, Any]]:
    current_stage_name = project_dict.get("current_stage", "Notification (Sec 11)")
    comp_pct = float(project_dict.get("compensation_percentage", 0))
    disputes = int(project_dict.get("legal_disputes_count", 0))
    approval_days = int(project_dict.get("approval_delay_days", 0))
    possession_pct = float(project_dict.get("possession_percentage", 0))
    rehab_pct = float(project_dict.get("rehabilitation_percentage", 0))

    # Find current stage index
    current_idx = 1
    for s in STATUTORY_STAGES:
        if s["name"].lower() in current_stage_name.lower():
            current_idx = s["number"]
            break

    stages_output = []
    for s in STATUTORY_STAGES:
        num = s["number"]
        name = s["name"]
        expected = s["expected_days"]

        if num < current_idx:
            status = "Completed"
            prob = 0.1
            risk = 10.0
            bottleneck = "Resolved"
            actual = expected
        elif num == current_idx:
            prob = round(overall_delay_prob, 3)
            risk = round(prob * 100, 1)
            actual = expected + int(approval_days * 0.7)
            if prob > 0.75:
                status = "Delayed"
            elif prob > 0.5:
                status = "At Risk"
            else:
                status = "In Progress"

            # Stage-specific bottleneck reasoning
            if "Compensation" in name:
                bottleneck = f"Pending disbursement ({comp_pct:.0f}% released)"
            elif "Legal" in name or "Objection" in name:
                bottleneck = f"{disputes} title objections pending in court"
            elif "Possession" in name:
                bottleneck = f"Physical handover lag ({possession_pct:.0f}% possession)"
            elif "Rehabilitation" in name:
                bottleneck = f"R&R colony infrastructure ({rehab_pct:.0f}% ready)"
            else:
                bottleneck = "Inter-agency clearance backlog" if approval_days > 30 else "On Track"
        else:
            status = "Pending"
            actual = 0
            # Future stages inherit downstream friction
            if "Compensation" in name and comp_pct < 60:
                prob = min(round(overall_delay_prob * 1.05, 3), 0.95)
                risk = round(prob * 100, 1)
                bottleneck = "Anticipated disbursement hurdle"
            elif "Legal" in name and disputes > 1:
                prob = min(round(overall_delay_prob * 1.02, 3), 0.92)
                risk = round(prob * 100, 1)
                bottleneck = "Potential valuation appeals"
            elif "Possession" in name and possession_pct < 30:
                prob = round(overall_delay_prob * 0.9, 3)
                risk = round(prob * 100, 1)
                bottleneck = "Dependent on prior R&R clearance"
            else:
                prob = round(overall_delay_prob * 0.7, 3)
                risk = round(prob * 100, 1)
                bottleneck = "None anticipated"

        stages_output.append({
            "stage_number": num,
            "stage_name": name,
            "expected_duration_days": expected,
            "actual_duration_days": actual,
            "status": status,
            "delay_probability": prob,
            "stage_risk": risk,
            "bottleneck": bottleneck
        })

    return stages_output

def predict_project(project_data: Dict[str, Any]) -> Dict[str, Any]:
    bundle = load_active_bundle()

    # Fallback heuristic calculation if model bundle is not yet loaded
    if bundle is None:
        comp_pct = float(project_data.get("compensation_percentage", 50))
        disputes = int(project_data.get("legal_disputes_count", 0))
        approval_days = int(project_data.get("approval_delay_days", 0))
        doc_complete = bool(project_data.get("documentation_complete", False))
        stakeholder = str(project_data.get("stakeholder_responsiveness", "Medium")).lower()

        raw_score = (
            (100 - comp_pct) * 0.35 +
            min(disputes * 15, 30) +
            min(approval_days * 0.25, 20) +
            (15 if not doc_complete else -5) +
            (15 if stakeholder == "low" else -10 if stakeholder == "high" else 0)
        )
        delay_prob = float(np.clip(raw_score / 100.0, 0.05, 0.98))
        pred_delay_days = int(delay_prob * 90 + approval_days * 0.4)
        confidence = 0.85
        model_version = "v1.0.0-fallback"
    else:
        # Build DataFrame with proper feature schema
        row = {}
        for col in FEATURE_COLUMNS:
            row[col] = [project_data.get(col, 0)]
        df_row = pd.DataFrame(row)

        preprocessor = bundle["preprocessor"]
        clf = bundle["classifier"]
        reg = bundle.get("regressor")

        X_proc = preprocessor.transform(df_row)
        probs = clf.predict_proba(X_proc)[0]
        delay_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        
        # Predicted delay days from regressor
        if reg:
            raw_pred_days = reg.predict(X_proc)[0]
            pred_delay_days = max(int(raw_pred_days), 0)
        else:
            pred_delay_days = int(delay_prob * 85)

        confidence = float(np.max(probs))
        model_version = bundle.get("version", "v1.0.0-ml")

    # Format risk score and category
    risk_score = round(delay_prob * 10.0, 1)
    if risk_score >= 8.0:
        risk_category = "CRITICAL"
    elif risk_score >= 6.0:
        risk_category = "HIGH"
    elif risk_score >= 3.5:
        risk_category = "MEDIUM"
    else:
        risk_category = "LOW"

    # Time-to-delay window estimations (30-day, 60-day, 90-day likelihood)
    risk_30d = round(delay_prob * 0.45, 2)
    risk_60d = round(delay_prob * 0.78, 2)
    risk_90d = round(min(delay_prob * 1.15, 0.99), 2)

    # Explainable AI factors
    risk_factors = explain_project_risk(project_data)

    # Stage-wise delay risk
    stage_breakdown = calculate_stage_wise_risk(project_data, delay_prob)

    return {
        "delay_probability": round(delay_prob, 3),
        "risk_score": risk_score,
        "risk_category": risk_category,
        "predicted_delay_days": pred_delay_days,
        "confidence_score": round(confidence, 2),
        "risk_30d": risk_30d,
        "risk_60d": risk_60d,
        "risk_90d": risk_90d,
        "model_version": model_version,
        "risk_factors": risk_factors,
        "stage_breakdown": stage_breakdown
    }
