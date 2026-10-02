from fastapi import APIRouter
from backend.app.api.endpoints import (
    auth, projects, dashboard, predict, alerts, recommendations, model, map, admin, documents, chatbot, support
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Executive Dashboard"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects & Lifecycle"])
api_router.include_router(predict.router, prefix="/predict", tags=["AI Prediction & XAI"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Intelligent Alerts"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Action Recommendations"])
api_router.include_router(map.router, prefix="/map", tags=["GIS & Mapping"])
api_router.include_router(model.router, prefix="/model", tags=["ML Model Operations"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration & Audit"])
api_router.include_router(documents.router, prefix="/documents", tags=["Document Repository"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["AI Chatbot"])
api_router.include_router(support.router, prefix="/support", tags=["Helpline & Support"])

