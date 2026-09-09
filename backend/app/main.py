from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app.include_router(appointments_router)


@app.get("/health", tags=["health"], summary="Health check")
def health_check():
    """Quick liveness check — confirms the server is running."""
    return {"status": "ok"}
