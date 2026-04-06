from fastapi import FastAPI

app = FastAPI(title="TreeNotes API", version="0.1.0")


@app.get("/")
def root():
    return {"message": "Backend running"}


@app.get("/health")
def health():
    """For load balancers / future docker-compose depends_on on the API."""
    return {"status": "ok"}
