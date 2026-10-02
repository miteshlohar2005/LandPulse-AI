"""
LandGuard Helpline & Support Center API

Endpoints for:
- Public: get support config, submit tickets, check ticket status
- Admin: list/search/filter tickets, update tickets, configure support contact info
"""

import datetime
import random
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.app.database.session import get_db
from backend.app.models.entities import SupportTicket, SupportConfig

router = APIRouter()


# ─── Pydantic Models ────────────────────────────────────────────────────────

class SupportConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    support_phone: str
    support_email: str
    support_hours: str


class SupportConfigUpdate(BaseModel):
    support_phone: Optional[str] = None
    support_email: Optional[str] = None
    support_hours: Optional[str] = None


class TicketCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    category: str
    subject: str
    description: str


class TicketStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: str
    status: str
    category: str
    subject: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    admin_response: Optional[str] = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    category: str
    subject: str
    description: str
    status: str
    admin_response: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    admin_response: Optional[str] = None
    assigned_to: Optional[str] = None


class TicketCreateResponse(BaseModel):
    ticket_id: str
    message: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _generate_ticket_id(db: Session) -> str:
    """Generate a unique ticket ID like #LG-2026-0042."""
    year = datetime.datetime.utcnow().year
    # Get the current count of tickets this year
    count = db.query(SupportTicket).filter(
        SupportTicket.ticket_id.like(f"#LG-{year}-%")
    ).count()
    next_num = count + 1 + random.randint(0, 3)  # Small random offset to avoid predictability
    return f"#LG-{year}-{next_num:04d}"


def _ensure_config(db: Session) -> SupportConfig:
    """Ensure the singleton SupportConfig row exists and return it."""
    config = db.query(SupportConfig).filter(SupportConfig.id == 1).first()
    if not config:
        config = SupportConfig(
            id=1,
            support_phone="+91 XXXXX XXXXX",
            support_email="support@landguard.ai",
            support_hours="Monday–Saturday | 9:00 AM–6:00 PM"
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def _serialize_datetime(dt) -> Optional[str]:
    """Safely serialize a datetime to ISO string."""
    if dt is None:
        return None
    if isinstance(dt, datetime.datetime):
        return dt.isoformat()
    return str(dt)


# ─── Public Endpoints ────────────────────────────────────────────────────────

@router.get("/config", response_model=SupportConfigResponse)
def get_support_config(db: Session = Depends(get_db)):
    """Get the current support contact configuration (phone, email, hours)."""
    config = _ensure_config(db)
    return SupportConfigResponse(
        support_phone=config.support_phone,
        support_email=config.support_email,
        support_hours=config.support_hours
    )


@router.post("/tickets", response_model=TicketCreateResponse)
def create_support_ticket(ticket_data: TicketCreate, db: Session = Depends(get_db)):
    """Submit a new support request. Returns a unique ticket ID."""
    # Validate required fields
    if not ticket_data.full_name or not ticket_data.full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required")
    if not ticket_data.email or not ticket_data.email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    if not ticket_data.category or not ticket_data.category.strip():
        raise HTTPException(status_code=400, detail="Issue category is required")
    if not ticket_data.subject or not ticket_data.subject.strip():
        raise HTTPException(status_code=400, detail="Subject is required")
    if not ticket_data.description or not ticket_data.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    # Validate category
    valid_categories = [
        "Land Records", "Property Ownership", "Document Problems",
        "Land Dispute", "Application Delay", "Technical Problem", "Other"
    ]
    if ticket_data.category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}")

    ticket_id = _generate_ticket_id(db)

    ticket = SupportTicket(
        ticket_id=ticket_id,
        full_name=ticket_data.full_name.strip(),
        email=ticket_data.email.strip(),
        phone=ticket_data.phone.strip() if ticket_data.phone else None,
        category=ticket_data.category,
        subject=ticket_data.subject.strip(),
        description=ticket_data.description.strip(),
        status="Request Received"
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return TicketCreateResponse(
        ticket_id=ticket_id,
        message=f"Your support request has been submitted successfully. Your Ticket ID is {ticket_id}. Our support team will contact you soon."
    )


@router.get("/tickets/{ticket_id}/status", response_model=TicketStatusResponse)
def check_ticket_status(ticket_id: str, db: Session = Depends(get_db)):
    """Check the status of a support ticket by its ticket ID."""
    # Normalize: add # prefix if missing
    if not ticket_id.startswith("#"):
        ticket_id = f"#{ticket_id}"

    ticket = db.query(SupportTicket).filter(SupportTicket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"No ticket found with ID {ticket_id}")

    return TicketStatusResponse(
        ticket_id=ticket.ticket_id,
        status=ticket.status,
        category=ticket.category,
        subject=ticket.subject,
        created_at=_serialize_datetime(ticket.created_at),
        updated_at=_serialize_datetime(ticket.updated_at),
        admin_response=ticket.admin_response
    )


# ─── Admin Endpoints ─────────────────────────────────────────────────────────

@router.get("/admin/tickets", response_model=List[TicketResponse])
def list_admin_tickets(
    search: Optional[str] = Query(None, description="Search by name, email, ticket ID, or subject"),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Admin: List all support tickets with optional search and filters."""
    query = db.query(SupportTicket)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                SupportTicket.full_name.ilike(search_term),
                SupportTicket.email.ilike(search_term),
                SupportTicket.ticket_id.ilike(search_term),
                SupportTicket.subject.ilike(search_term)
            )
        )

    if category:
        query = query.filter(SupportTicket.category == category)

    if status:
        query = query.filter(SupportTicket.status == status)

    tickets = query.order_by(desc(SupportTicket.created_at)).offset(offset).limit(limit).all()

    return [
        TicketResponse(
            id=t.id,
            ticket_id=t.ticket_id,
            full_name=t.full_name,
            email=t.email,
            phone=t.phone,
            category=t.category,
            subject=t.subject,
            description=t.description,
            status=t.status,
            admin_response=t.admin_response,
            assigned_to=t.assigned_to,
            created_at=_serialize_datetime(t.created_at),
            updated_at=_serialize_datetime(t.updated_at)
        )
        for t in tickets
    ]


@router.put("/admin/tickets/{ticket_id}", response_model=TicketResponse)
def update_admin_ticket(ticket_id: str, update: TicketUpdate, db: Session = Depends(get_db)):
    """Admin: Update a support ticket's status, response, or assignment."""
    if not ticket_id.startswith("#"):
        ticket_id = f"#{ticket_id}"

    ticket = db.query(SupportTicket).filter(SupportTicket.ticket_id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"No ticket found with ID {ticket_id}")

    valid_statuses = [
        "Request Received", "Under Review", "Support Team Assigned",
        "Additional Information Required", "Resolved", "Closed"
    ]

    if update.status is not None:
        if update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        ticket.status = update.status

    if update.admin_response is not None:
        ticket.admin_response = update.admin_response

    if update.assigned_to is not None:
        ticket.assigned_to = update.assigned_to

    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(ticket)

    return TicketResponse(
        id=ticket.id,
        ticket_id=ticket.ticket_id,
        full_name=ticket.full_name,
        email=ticket.email,
        phone=ticket.phone,
        category=ticket.category,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status,
        admin_response=ticket.admin_response,
        assigned_to=ticket.assigned_to,
        created_at=_serialize_datetime(ticket.created_at),
        updated_at=_serialize_datetime(ticket.updated_at)
    )


@router.put("/admin/config", response_model=SupportConfigResponse)
def update_support_config(config_update: SupportConfigUpdate, db: Session = Depends(get_db)):
    """Admin: Update the support contact configuration."""
    config = _ensure_config(db)

    if config_update.support_phone is not None:
        config.support_phone = config_update.support_phone
    if config_update.support_email is not None:
        config.support_email = config_update.support_email
    if config_update.support_hours is not None:
        config.support_hours = config_update.support_hours

    config.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(config)

    return SupportConfigResponse(
        support_phone=config.support_phone,
        support_email=config.support_email,
        support_hours=config.support_hours
    )
