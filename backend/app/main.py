from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.exceptions import AppointmentConflictError, InvalidStatusTransitionError
from app.routes.appointments import router as appointments_router

app = FastAPI(
    title="Appointment Board API",
    version="0.1.0",
    description="Backend API for the Appointment Board application.",
)

# Allow the Vite dev server to reach the API during development.
# Tighten origins before any production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Map application exceptions to HTTP status codes
@app.exception_handler(AppointmentConflictError)
async def appointment_conflict_handler(
    request: Request, exc: AppointmentConflictError
) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": exc.message},
    )


@app.exception_handler(InvalidStatusTransitionError)
async def invalid_status_transition_handler(
    request: Request, exc: InvalidStatusTransitionError
) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": exc.message},
    )


app.include_router(appointments_router)


@app.get("/health", tags=["health"], summary="Health check")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
