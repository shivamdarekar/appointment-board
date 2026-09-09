import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate


def get_appointments(
    db: Session,
    filter_date: date | None = None,
    filter_status: AppointmentStatus | None = None,
) -> list[Appointment]:
    """Return all appointments, optionally filtered by date and/or status."""
    query = db.query(Appointment)

    if filter_date is not None:
        query = query.filter(Appointment.appointment_date == filter_date)

    if filter_status is not None:
        query = query.filter(Appointment.status == filter_status)

    return query.order_by(Appointment.appointment_date, Appointment.start_time).all()


def get_appointment(db: Session, appointment_id: uuid.UUID) -> Appointment:
    """Return a single appointment by ID, or raise 404."""
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {appointment_id} not found.",
        )
    return appointment


def create_appointment(db: Session, data: AppointmentCreate) -> Appointment:
    """Persist a new appointment and return it.

    Overlap detection is intentionally deferred to the next phase.
    """
    appointment = Appointment(
        title=data.title,
        description=data.description,
        appointment_date=data.appointment_date,
        start_time=data.start_time,
        end_time=data.end_time,
        status=AppointmentStatus.SCHEDULED,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def update_appointment(
    db: Session, appointment_id: uuid.UUID, data: AppointmentUpdate
) -> Appointment:
    """Apply a partial update to an existing appointment.

    Only fields explicitly provided (non-None) are updated.
    Overlap detection is intentionally deferred to the next phase.
    """
    appointment = get_appointment(db, appointment_id)

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    # If only one of start_time / end_time is being updated, validate the
    # resulting pair to catch mismatches the schema validator couldn't see
    # (e.g. new start_time sent without new end_time).
    effective_start = update_data.get("start_time", appointment.start_time)
    effective_end = update_data.get("end_time", appointment.end_time)
    if effective_end <= effective_start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_time must be strictly after start_time.",
        )

    db.commit()
    db.refresh(appointment)
    return appointment


def complete_appointment(db: Session, appointment_id: uuid.UUID) -> Appointment:
    """Mark an appointment as completed."""
    appointment = get_appointment(db, appointment_id)

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A cancelled appointment cannot be completed.",
        )
    if appointment.status == AppointmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointment is already completed.",
        )

    appointment.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(appointment)
    return appointment


def cancel_appointment(db: Session, appointment_id: uuid.UUID) -> Appointment:
    """Mark an appointment as cancelled.

    The record is never deleted — cancelled appointments remain visible.
    """
    appointment = get_appointment(db, appointment_id)

    if appointment.status == AppointmentStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Appointment is already cancelled.",
        )

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appointment)
    return appointment
