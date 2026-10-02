import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.entities import Document, Project, User, AuditLog
from backend.app.schemas.schemas import DocumentResponse
from backend.app.auth.rbac import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".png", ".jpg"}

@router.get("/{project_id}", response_model=List[DocumentResponse])
def get_project_documents(project_id: str, db: Session = Depends(get_db)):
    return db.query(Document).filter(Document.project_id == project_id).all()

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    project_id: str = Form(...),
    category: str = Form("Joint Inspection Report"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    project_upload_dir = os.path.join(settings.UPLOAD_DIR, project_id)
    os.makedirs(project_upload_dir, exist_ok=True)
    file_path = os.path.join(project_upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_kb = max(int(os.path.getsize(file_path) / 1024), 1)

    doc = Document(
        project_id=project_id,
        document_name=file.filename,
        category=category,
        file_type=ext.replace(".", "").upper(),
        file_size_kb=file_size_kb,
        file_path=file_path,
        verified=True
    )
    db.add(doc)

    audit = AuditLog(
        user_email=current_user.email,
        action="DOCUMENT_UPLOADED",
        entity_type="Document",
        entity_id=file.filename,
        details=f"Uploaded '{category}' document for project {project_id} ({file_size_kb} KB)"
    )
    db.add(audit)
    db.commit()
    db.refresh(doc)
    return doc
