import uuid
from datetime import date, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppointmentConflictError, InvalidStatusTransitionError
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate

# Statuses that occupy a time slot and block new appointments.
# - scheduled: actively holds the slot
# - completed: already happened; does not block future scheduling
# - cancelled: vacated; does not block future scheduling
_BLOCKING_STATUSES = (AppointmentStatus.SCHEDULED,)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _check_conflict(
    db: Session,
    appt_date: date,
    start: time,
    end: time,
    exclude_id: uuid.UUID | None = None,
) -> None:
    """Query the database for any active appointment that overlaps the given slot.

    Uses the half-open interval overlap test:
        existing_start < new_end  AND  existing_end > new_start

    Adjacent appointments (one ends exactly when the next begins) are allowed.

    Only appointments with a blocking status are considered.
    Cancelled and completed appointments do not block a slot.

    Raises AppointmentConflictError if a conflict is found.
    """
    query = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date == appt_date,
            Appointment.status.in_(_BLOCKING_STATUSES),
            Appointment.start_time < end,
            Appointment.end_time > start,
        )
    )

    if exclude_id is not None:
        # When updating, exclude the appointment being edited from its own check.
        query = query.filter(Appointment.id != exclude_id)

    conflict = query.first()
    if conflict is not None:
        raise AppointmentConflictError()


# ---------------------------------------------------------------------------
# Public service functions
# ---------------------------------------------------------------------------

def get_appointments(
    db: Session,
    filter_date: date | None = None,
    filter_status: AppointmentStatus | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    """Return a paginated, optionally filtered list of appointments.

    Filtering is applied at the database level before COUNT and LIMIT/OFFSET,
    so pagination is always consistent with the active filters.

    Returns a dict matching PaginatedAppointmentResponse:
        items       — appointments for the requested page
        page        — the requested page number
        page_size   — the requested page size
        total       — total matching records (across all pages)
        total_pages — total number of pages
    """
    query = db.query(Appointment)

    if filter_date is not None:
        query = query.filter(Appointment.appointment_date == filter_date)

    if filter_status is not None:
        query = query.filter(Appointment.status == filter_status)

    # Count BEFORE applying LIMIT/OFFSET so the total reflects the full
    # filtered set, not just the current page.
    total: int = query.count()
    total_pages = max(1, -(-total // page_size)) if total > 0 else 0

    # Stable ordering: date → start_time → created_at (tie-break)
    items = (
        query
        .order_by(Appointment.appointment_date, Appointment.start_time, Appointment.created_at)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


def get_appointment(db: Session, appointment_id: uuid.UUID) -> Appointment:
    """Return a single appointment by UUID, or raise 404."""
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Appointment {appointment_id} not found.",
        )
    return appointment


def create_appointment(db: Session, data: AppointmentCreate) -> Appointment:
    """Persist a new appointment after verifying the time slot is free.

    Conflict rule:
        Only 'scheduled' appointments block a slot.
        Cancelled and completed appointments do not.

    Raises AppointmentConflictError if the slot is taken.
    """
    _check_conflict(db, data.appointment_date, data.start_time, data.end_time)

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

    Only scheduled appointments may be edited.
    Completed and cancelled appointments are read-only historical records.

    Only fields explicitly provided (non-None) are applied.
    The conflict check always excludes the appointment being updated so it
    does not conflict with its own existing slot.

    Raises InvalidStatusTransitionError if the appointment is not scheduled.
    Raises AppointmentConflictError if the new slot is taken by another appointment.
    """
    appointment = get_appointment(db, appointment_id)

    if appointment.status == AppointmentStatus.COMPLETED:
        raise InvalidStatusTransitionError("Completed appointments cannot be edited.")
    if appointment.status == AppointmentStatus.CANCELLED:
        raise InvalidStatusTransitionError("Cancelled appointments cannot be edited.")

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    # Resolve the effective date/time after applying the partial update.
    effective_date: date = update_data.get("appointment_date", appointment.appointment_date)
    effective_start: time = update_data.get("start_time", appointment.start_time)
    effective_end: time = update_data.get("end_time", appointment.end_time)

    # Service-level time ordering guard (schema catches it when both times
    # are provided together; this catches the mixed partial-update case).
    if effective_end <= effective_start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_time must be strictly after start_time.",
        )

    _check_conflict(db, effective_date, effective_start, effective_end, exclude_id=appointment_id)

    db.commit()
    db.refresh(appointment)
    return appointment


def complete_appointment(db: Session, appointment_id: uuid.UUID) -> Appointment:
    """Mark an appointment as completed.

    Valid transition: scheduled → completed
    Invalid: cancelled → completed, completed → completed
    """
    appointment = get_appointment(db, appointment_id)

    if appointment.status == AppointmentStatus.COMPLETED:
        raise InvalidStatusTransitionError("This appointment is already completed.")
    if appointment.status == AppointmentStatus.CANCELLED:
        raise InvalidStatusTransitionError("Cancelled appointments cannot be completed.")

    appointment.status = AppointmentStatus.COMPLETED
    db.commit()
    db.refresh(appointment)
    return appointment


def cancel_appointment(db: Session, appointment_id: uuid.UUID) -> Appointment:
    """Mark an appointment as cancelled.

    Valid transition: scheduled → cancelled
    Invalid: cancelled → cancelled, completed → cancelled

    The record is never deleted — cancelled appointments remain visible.
    """
    appointment = get_appointment(db, appointment_id)

    if appointment.status == AppointmentStatus.CANCELLED:
        raise InvalidStatusTransitionError("This appointment is already cancelled.")
    if appointment.status == AppointmentStatus.COMPLETED:
        raise InvalidStatusTransitionError("Completed appointments cannot be cancelled.")

    appointment.status = AppointmentStatus.CANCELLED
    db.commit()
    db.refresh(appointment)
    return appointment
