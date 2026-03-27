"""FastAPI health check server.

GET /health returns {"status": "ok"}.
Runs on port 8080 for Fly.io health checks.
"""

from fastapi import FastAPI

app = FastAPI(docs_url=None, redoc_url=None)


@app.get("/health")
async def health():
    return {"status": "ok"}
