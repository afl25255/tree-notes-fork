# Plan: Next Immediate Tasks

## 1) Backend (Person B)

### Already finished
- backend foundation
- CRUD
- DB schema
- Docker stack
- nginx proxy
- tests
- frontend integration
- enhanced CRUD aligned with frontend JSON (heading, cueText, summary, boxes with style + lines); round-trip covered by API tests and fixtures
- linking endpoints: `POST /links/create`, `POST /links/delete`, `GET /links/list?note_id=...`
- **`POST /ai/analyze`**: Cornell-shaped body; server-side **Gemini** (when `GEMINI_API_KEY` + `AI_PROVIDER=auto|gemini`) or **Ollama** (`AI_PROVIDER=ollama`); **placeholder** when no key; frontend calls API only (keys stay on server)

### Backend next steps (align with Month 2 → Month 3)
- Start planning semantic endpoints (Month 6; prepare early)
  - `GET /semantic/search`
  - `GET /semantic/suggest-links`

## 2) AI Integration (Person C)

### Context (already discussed)
- Ollama is too heavy for Rex’s laptop
- Gemini API is cheap + fast
- Tool calling is possible

### Already finished (baseline)
- Backend calls **Gemini** (or **Ollama** on the server) for analyze; browser does not hold API keys
- Baseline contract: request matches note export / `NoteUpdate`; response includes `status`, `message`, **`analysis`** (markdown for the insights panel), plus `concepts` and `suggested_links` (reserved for structured use later)
- UI **Analyze** button uses `POST {API}/ai/analyze` with `apiBodyFromCanvas()`
- Env: `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL` (see `.env.example` and `docker-compose.yml`)

### AI integration next steps
- Wire **structured** outputs: populate `concepts` and `suggested_links` (e.g. JSON mode or tool calling) and surface them in the UI
- Implement Gemini-based **function calling** prototype (extract concepts, suggest links, cue questions) beyond a single markdown blob
- Plan for future semantic search
  - Decide embedding strategy (Gemini embeddings or local vector DB)

## 3) Database & DevOps (Person D)

### Already
- set up Postgres
- added schema
- added Alembic
- added Docker stack
- configured nginx
- Railway subscription for CI/CD

### Database & DevOps next steps
- Finalize DB schema for nodes & links
  - Ensure it matches frontend JSON exactly (re-verify after any frontend export changes)
- Add constraints + indexes for fast graph queries
- Prepare for semantic search (vector column later)
- Set up CI/CD with GitHub Actions + Railway
  - Auto-build Docker images
  - Auto-run backend tests
  - Auto-deploy API + DB migrations
  - Auto-deploy frontend static files to Railway or a CDN
- Add test Postgres in CI
  - Run backend tests against a real Postgres instance
  - Ensure migrations run cleanly
