import os
import sys

# Ensure root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.database.session import engine, Base

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=f"{settings.PROJECT_NAME} - DoLR / MoRD",
    description=(
        "Predictive Analytics System for Early Detection of Land Acquisition Delays\n\n"
        "Ministry of Rural Development | Department of Land Resources (DoLR)\n\n"
        "**Notice:** Demonstration Dataset - Predictions are for demonstration purposes "
        "and should not be used as official administrative decisions."
    ),
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS middleware for local frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ml_engine": "online",
        "timestamp": os.getenv("CURRENT_TIME", "2026-09-02T21:30:00")
    }

# Include master API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve built frontend if dist exists
frontend_dist = os.path.join(settings.PROJECT_ROOT, "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "platform": settings.PROJECT_NAME,
            "tagline": settings.TAGLINE,
            "ministry": "Ministry of Rural Development",
            "department": "Department of Land Resources (DoLR)",
            "status": "OPERATIONAL",
            "docs_url": "/api/docs",
            "version": settings.VERSION,
            "dataset_notice": "Demonstration Dataset - Predictions are for demonstration purposes and should not be used as official administrative decisions."
        }
