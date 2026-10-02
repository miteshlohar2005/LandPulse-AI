import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_login_admin():
    res = client.post("/api/auth/login", json={
        "email": "admin@landguard.gov.in",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Administrator"

def test_dashboard_summary():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["total_projects"] >= 1000
    assert "state_distribution" in data
    assert len(data["state_distribution"]) > 0
    assert "district_trends" in data
    assert "top_delay_factors" in data

def test_projects_list():
    res = client.get("/api/projects?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) == 10
    assert data["total"] >= 1000

def test_flagship_project_detail():
    res = client.get("/api/projects/LA-JH-2026-0042")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "LA-JH-2026-0042"
    assert data["state"] == "Jharkhand"
    assert data["district"] == "Ranchi"
    assert data["latest_prediction"] is not None
    assert data["latest_prediction"]["delay_probability"] >= 0.75
    assert len(data["stages"]) == 9
    assert len(data["recommendations"]) > 0

def test_predict_endpoint():
    payload = {
        "land_area_hectares": 450.0,
        "affected_families": 620,
        "compensation_percentage": 25.0,
        "approval_delay_days": 70,
        "legal_disputes_count": 4,
        "documentation_complete": False,
        "notification_complete": True,
        "possession_percentage": 20.0,
        "rehabilitation_percentage": 15.0,
        "historical_district_delay_score": 7.4,
        "project_type": "Highways & Expressways",
        "current_stage": "Compensation Disbursement",
        "stakeholder_responsiveness": "Low",
        "state": "Jharkhand"
    }
    res = client.post("/api/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "delay_probability" in data
    assert "risk_score" in data
    assert "risk_category" in data
    assert "risk_factors" in data
    assert "stage_breakdown" in data
    assert data["risk_category"] in ["HIGH", "CRITICAL"]

def test_map_projects():
    res = client.get("/api/map/projects?limit=50")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 50
    feat = data["features"][0]
    assert "latitude" in feat
    assert "longitude" in feat
    assert "risk_category" in feat

def test_alerts_endpoint():
    res = client.get("/api/alerts?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "severity" in data[0]

def test_model_status():
    res = client.get("/api/model/status")
    assert res.status_code == 200
    data = res.json()
    assert "active_model" in data
    assert "algorithm" in data["active_model"]
