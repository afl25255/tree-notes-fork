# TreeNotes — Backend

FastAPI service with **PostgreSQL** persistence for Cornell-style notes: metadata (heading, cue, summary), draggable **boxes** (numeric `local_id`, position, color), and **undirected edges** between boxes (stored canonically as `n1 < n2` per note).

## Stack

- **FastAPI** + **SQLModel** (Pydantic v2) + **Alembic** migrations
- **psycopg2** sync driver (`postgresql+psycopg2://…`)
- **pytest** + `TestClient` (SQLite in-memory for API tests)

## Configuration

Environment variables (see root **`.env.example`**):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLAlchemy URL, e.g. `postgresql+psycopg2://postgres:changeme@127.0.0.1:5432/treenotes` |
| `CORS_ORIGINS` | Comma-separated origins allowed for the browser (e.g. static frontend on port 8080) |

Optional: copy `.env` in the repo root next to `docker-compose.yml`, or place a `.env` file under `BackEnd/` when running uvicorn from that folder (pydantic-settings loads `.env` from the current working directory).

## Run locally

1. Start PostgreSQL (from repo root):

   ```bash
   copy .env.example .env
   docker compose up -d db
   ```

2. Apply migrations and start the API (from **`BackEnd/`**):

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   python -m alembic upgrade head
   uvicorn main:app --reload --port 8000
   ```

- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- OpenAPI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Docker (API + Postgres)

From the repository root:

```bash
docker compose up -d
```

Builds the `api` image from `BackEnd/Dockerfile`, runs `alembic upgrade head`, then **uvicorn** on port **8000** (override with `API_PORT` in `.env`).

## HTTP API (summary)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Alive |
| `GET` | `/health` | Health JSON |
| `GET` | `/notes` | List notes (`id`, `heading`, `updated_at`) |
| `POST` | `/notes` | Create note (optional JSON body; matches frontend export shape) |
| `GET` | `/notes/{note_id}` | Full note document (same shape as frontend JSON export) |
| `PUT` | `/notes/{note_id}` | Replace note content (full document) |
| `DELETE` | `/notes/{note_id}` | Delete note and related rows |

**Document shape** aligns with [frontend/script.js](../frontend/script.js) `download()` / `upload()`: `heading`, `cueText`, `summary`, `boxes[]` with `id`, `content`, `style` (`left`, `top`, `backgroundColor`), `lines` (neighbor ids). The API **normalizes** edges to undirected pairs for storage; `GET` returns symmetric `lines` for each box.

## Tests

```bash
cd BackEnd
pytest tests -v
```

## Next steps (roadmap)

1. Wire the **frontend** to these endpoints (replace or supplement file export).
2. **Proxy Ollama** (or other LLM) through FastAPI instead of calling from the browser.
3. **Auth** and multi-user notes when needed.
4. **Graph / semantic search** endpoints (indexes, embeddings) per project timeline.
