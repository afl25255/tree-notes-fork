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

### Backend next steps (align with Month 2 → Month 3)
- Finish enhanced CRUD
  - Add missing fields (colors, positions, links) to fully match frontend JSON export
  - Ensure round-trip save/load is 100% identical to frontend JSON format
- Implement linking endpoints (match frontend drag-and-drop linking)
  - `POST /links/create`
  - `POST /links/delete`
  - `GET /links/list?note_id=...`
- Prepare backend for AI integration
  - Placeholder endpoint: `POST /ai/analyze` (accept Cornell note structure; return dummy response for now)
- Start planning semantic endpoints (Month 6; prepare early)
  - `GET /semantic/search`
  - `GET /semantic/suggest-links`

## 2) AI Integration (Person C)

### Context (already discussed)
- Ollama is too heavy for Rex’s laptop
- Gemini API is cheap + fast
- Tool calling is possible

### AI integration next steps
- Define the AI service contract
  - What does the frontend send?
  - What does the backend return?
  - What fields does the AI need? (title, cue text, boxes, links, summary)
- Implement Gemini-based function calling prototype
  - Extract concepts
  - Suggest new links
  - Summarize notes
  - Provide cue-column questions
- Create backend wrapper for AI
  - Backend should call Gemini, not the browser (avoids CORS and hides API keys)
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
  - Ensure it matches frontend JSON exactly
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
