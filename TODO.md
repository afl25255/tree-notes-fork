# TODO

## Next steps

If you plan to continue developing this project, the most natural order is:

1. Add a backend Dockerfile and compose service for the FastAPI app.
2. Connect FastAPI to PostgreSQL.
3. Define a schema for notes, boxes, and links.
4. Replace file-only save/load with API-based persistence.
5. Move Ollama calls behind the backend instead of calling it directly from the browser.
6. Add tests for frontend save/load behavior and backend API routes.
