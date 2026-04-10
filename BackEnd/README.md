# TreeNotes — Backend

This folder holds the **FastAPI** service for TreeNotes. It is a **starter only**: it runs an HTTP API but does not yet talk to PostgreSQL or the frontend.

## What’s new

- **FastAPI application** (`main.py`) with:
  - `GET /` — simple alive response for quick checks.
  - `GET /health` — health payload for proxies, orchestration, or a future `docker compose` healthcheck on the API container.
- **Pinned-style dependencies** in `requirements.txt` (`fastapi`, `uvicorn[standard]`) so the team gets a consistent local run and auto-reload during development.

## Why this stack

- **FastAPI** fits the project plan: typed APIs, automatic OpenAPI docs, and straightforward async support when you add database and AI calls later.
- **Uvicorn** is the standard ASGI server for local development; production would typically use Uvicorn workers behind a process manager or container orchestrator (documented later in the project).
- Keeping the backend **separate from `frontend/`** matches a clear split: static UI vs API and persistence.

## How to run (local)

From the **repository root**, start PostgreSQL (optional for this skeleton, required once you add a database layer):

```bash
docker compose up -d
```

From **`backend/`**:

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

Default database URL (after you implement it) should align with root **`.env.example`**, e.g. host `127.0.0.1`, port `5432`, database `treenotes`, user `postgres`, password as set in `.env` (default in compose is `changeme` unless changed).

## What to do next

Suggested order for contributors:

1. **Configuration** — Load `DATABASE_URL` (and later `OLLAMA_*`) from environment; add a `.env` pattern documented next to the root `.env.example`.
2. **Database layer** — Add SQLAlchemy (or SQLModel) + **Alembic** migrations; define tables for notes/nodes and links per the agreed schema.
3. **API routes** — CRUD for notes and edges; Pydantic request/response models; consistent error handling (`HTTPException` / problem details).
4. **CORS** — If the frontend is served from another origin (e.g. `localhost:8080`), enable `CORSMiddleware` with explicit allowed origins in development.
5. **Docker** — Add a `Dockerfile` for the API and extend root `docker-compose.yml` with an `api` service that `depends_on` the `db` service’s healthcheck.
6. **Tests** — `pytest` + `httpx` AsyncClient against the FastAPI app; optional Testcontainers for Postgres in CI.
7. **AI integration** — Proxy or call Ollama from the API (not from the browser) once persistence exists, so keys and rate limits stay server-side.
8. **Production hardening** — No default passwords, no wide-open CORS, structured logging, migration job before deploy, and a production ASGI/process layout.

This README should be updated whenever major backend capabilities land (database, auth, compose service, CI).
