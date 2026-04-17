# TODO

## Next steps

1. Wire the frontend save/load flow to the FastAPI `/notes` API (keep JSON export as fallback if desired).
2. Move Ollama calls behind the backend instead of calling it directly from the browser.
3. Add frontend tests for API-backed save/load; extend backend tests (e.g. Postgres in CI) as needed.
4. Authentication and per-user notes when the product requires it.

## Done (backend baseline)

- FastAPI Dockerfile and `api` service in `docker-compose.yml`
- PostgreSQL schema (notes, boxes, edges) and Alembic migrations
- Note CRUD aligned with the frontend JSON export shape
- `pytest` coverage for health and note round-trip (SQLite in-memory)
