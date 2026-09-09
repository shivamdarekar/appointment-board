from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Appointment Board API",
    version="0.1.0",
)

# Allow the Vite dev server to call the API during development.
# Tighten origins before any production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Quick liveness check — confirms the server is running."""
    return {"status": "ok"}
