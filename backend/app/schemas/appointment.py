import uuid
from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    """Schema for creating a new appointment."""

    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None)
    appointment_date: date
    start_time: time
    end_time: time

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("title must not be blank")
        return v.strip()

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, end: time, info) -> time:
        start = info.data.get("start_time")
        if start is not None and end <= start:
            raise ValueError("end_time must be strictly after start_time")
        return end


class AppointmentUpdate(BaseModel):
    """Schema for updating an existing appointment.

    All fields are optional so the client can send only what changed.
    end_time validation runs only when both times are present.
    """

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None)
    appointment_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("title must not be blank")
        return v.strip() if v else v

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, end: time | None, info) -> time | None:
        if end is None:
            return end
        start = info.data.get("start_time")
        if start is not None and end <= start:
            raise ValueError("end_time must be strictly after start_time")
        return end


class AppointmentResponse(BaseModel):
    """Schema for appointment API responses."""

    id: uuid.UUID
    title: str
    description: str | None
    appointment_date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime

    # Allow Pydantic to read attributes from SQLAlchemy ORM objects directly.
    model_config = ConfigDict(from_attributes=True)
