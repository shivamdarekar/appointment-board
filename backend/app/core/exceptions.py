class AppointmentConflictError(Exception):
    """Raised when a requested time slot overlaps an existing active appointment."""

    def __init__(self, message: str = "Appointment time slot is already occupied.") -> None:
        super().__init__(message)
        self.message = message


class InvalidStatusTransitionError(Exception):
    """Raised when a status change is not valid for the appointment's current state."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
