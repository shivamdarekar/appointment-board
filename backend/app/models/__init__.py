# Import all models here so that Base.metadata is fully populated
# when Alembic or the application references it.
from app.models.appointment import Appointment, AppointmentStatus

__all__ = ["Appointment", "AppointmentStatus"]
