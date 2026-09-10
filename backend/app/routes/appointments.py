import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.appointment import AppointmentStatus
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    PaginatedAppointmentResponse,
)
from app.services import appointment_service

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


@router.get("", response_model=PaginatedAppointmentResponse, summary="List appointments")
def list_appointments(
    date: date | None = Query(default=None),
    status: AppointmentStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return paginated appointments with optional date/status filters."""
    return appointment_service.get_appointments(
        db,
        filter_date=date,
        filter_status=status,
        page=page,
        page_size=page_size,
    )


@router.get("/{appointment_id}", response_model=AppointmentResponse, summary="Get appointment")
def get_appointment(appointment_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a single appointment by ID."""
    return appointment_service.get_appointment(db, appointment_id)


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create appointment",
)
def create_appointment(data: AppointmentCreate, db: Session = Depends(get_db)):
    """Create a new appointment."""
    return appointment_service.create_appointment(db, data)


@router.put("/{appointment_id}", response_model=AppointmentResponse, summary="Update appointment")
def update_appointment(
    appointment_id: uuid.UUID, data: AppointmentUpdate, db: Session = Depends(get_db)
):
    """Update an existing appointment."""
    return appointment_service.update_appointment(db, appointment_id, data)


@router.patch(
    "/{appointment_id}/complete",
    response_model=AppointmentResponse,
    summary="Complete appointment",
)
def complete_appointment(appointment_id: uuid.UUID, db: Session = Depends(get_db)):
    """Mark an appointment as completed."""
    return appointment_service.complete_appointment(db, appointment_id)


@router.patch(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
    summary="Cancel appointment",
)
def cancel_appointment(appointment_id: uuid.UUID, db: Session = Depends(get_db)):
    """Cancel an appointment."""
    return appointment_service.cancel_appointment(db, appointment_id)
