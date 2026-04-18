# TODO

## Next steps

1. Move Ollama calls behind the backend instead of calling it directly from the browser.
2. Add frontend tests for API-backed save/load; extend backend tests (e.g. Postgres in CI) as needed.
3. Authentication and per-user notes when the product requires it.

## Done

- FastAPI Dockerfile and `api` service in `docker-compose.yml`
- PostgreSQL schema (notes, boxes, edges) and Alembic migrations
- Note CRUD aligned with the frontend JSON export shape
- `pytest` coverage for health and note round-trip (SQLite in-memory)
- Frontend: save/load via `/notes` (toolbar ☁️ 📂 📄), menu API URL, optional `?note=` and `?api=` query params; JSON file import/export retained
