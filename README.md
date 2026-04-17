# Tree Notes

Tree Notes is a visual note-taking app built around the Cornell Notes layout. The frontend lets you create draggable note boxes, connect them into a tree, keep cue and summary sections alongside the canvas, and export/import the note state as JSON. The repository also includes a small FastAPI backend starter and a Docker Compose file for PostgreSQL, which makes the project ready for a fuller API-backed version later.

## What is in this repository

- `frontend/` - the main application UI: static HTML, CSS, and vanilla JavaScript.
- `BackEnd/` - a minimal FastAPI service with health endpoints.
- `docker-compose.yml` - local PostgreSQL service definition.
- `.env.example` - example database environment variables for Docker Compose.
- `logo/` - project branding assets.

## How the app works

The current application is frontend-first. Most features run entirely in the browser, and no persistent backend storage is wired in yet.

### Cornell layout

The UI is split into three parts:

- `Heading` at the top for the note title.
- `Cue Column` on the left for keywords, prompts, or questions.
- `Notes` area on the right for a visual tree of connected note boxes.
- `Summary` at the bottom for the final wrap-up.

This structure is defined in [frontend/index.html](frontend/index.html).

### Visual note tree

Inside the notes area, each note is a draggable `.box` element managed by a JavaScript `Map` named `boxes`. Every box has:

- a unique numeric ID,
- editable text content,
- saved position and color,
- a list of linked box IDs.

Key frontend behaviors:

- `createNewBlock(...)` creates a new note box.
- `newLine(...)` creates an SVG connection between two boxes.
- `makeDraggable(...)` updates box position and redraws connected lines while dragging.
- `deleteBox(...)` removes the selected box and its connected links.

These behaviors live in [frontend/script.js](frontend/script.js).

### Text highlights and links from cue column to boxes

The cue column has a custom context menu. When text is selected there, the app can:

- highlight the selection with a color,
- attach the highlight to a tree box,
- turn the highlight into a clickable jump target for that box.

This is handled through `span` wrappers and `data-box-id` attributes in the frontend script.

### Canvas tools

The notes toolbar currently supports:

- adding a new box,
- zoom in / zoom out,
- toggling a guide grid,
- a dictation placeholder toggle,
- running local AI analysis with Ollama,
- downloading the note to JSON,
- uploading a saved JSON note,
- showing a note summary popup.

There is also:

- dark mode,
- fullscreen mode,
- panning around the note canvas,
- resizing the cue column vs note canvas split.

### Save and load format

The app can export the current note to a JSON file using `download()` and restore it using `upload()`.

The saved structure includes:

- heading text,
- cue column text,
- summary text,
- all boxes with IDs, content, position, background color, and links.

This means notes are currently portable as files, but they are not yet stored in PostgreSQL or sent to the FastAPI backend.

### Local AI analysis with Ollama

The `Analyze notes` button gathers the visible Cornell note data with `gatherCornellNotes()` and sends it directly from the browser to:

`http://localhost:11434/api/generate`

Important details:

- this does not go through the Python backend yet,
- the request is streamed and rendered into the `LLM Insights` panel,
- the default model fallback in code is `llama3`,
- if Ollama is not running locally, the UI shows an error message.

## Current architecture

### Frontend

The frontend is the real working application today.

- `frontend/index.html` defines the Cornell layout and toolbars.
- `frontend/style.css` defines light/dark theme styling, responsive layout, tree canvas, and floating toolbars.
- `frontend/script.js` contains all application logic.

### Backend

The backend is a **FastAPI** app in `BackEnd/` with **PostgreSQL** persistence (notes, boxes, edges), **Alembic** migrations, and **CORS** for a static frontend on another origin. See [BackEnd/README.md](BackEnd/README.md) for routes and run instructions.

It still does not:

- proxy Ollama (the UI calls Ollama from the browser),
- serve the frontend as static files (serve `frontend/` separately),
- authenticate users.

### Database

`docker-compose.yml` can start **PostgreSQL 15** (`treenotes_db`) and optionally the **`api`** service. The backend uses the database for note CRUD; the **frontend is not yet wired to the API** (export/import remains file-based until integrated).

## Run the project

### 1. Frontend only

If you just want to use the app UI, serve the `frontend/` folder with any static server.

Example with Python:

```bash
cd frontend
python -m http.server 8080
```

Then open:

`http://localhost:8080`

You can also build/run the frontend container:

```bash
cd frontend
docker build -t treenotes-frontend .
docker run --rm -p 8080:80 treenotes-frontend
```

### 2. Backend

From `BackEnd/` (with PostgreSQL reachable — see step 3):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn main:app --reload --port 8000
```

Then open:

- API root: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

### 3. PostgreSQL (and optional API via Docker)

From the repository root:

```bash
copy .env.example .env
docker compose up -d db
```

To run **Postgres and the API** together:

```bash
docker compose up -d
```

Default values from `.env.example`:

- `POSTGRES_USER=postgres`
- `POSTGRES_PASSWORD=changeme`
- `POSTGRES_DB=treenotes`
- `POSTGRES_PORT=5432`
- `DATABASE_URL` — used by the API when running locally (see `.env.example`)

### 4. Ollama for local analysis

If you want the AI analysis button to work, Ollama must be installed and running locally on port `11434`.

Example:

```bash
ollama run llama3
```

After that, open the frontend and click the robot button in the notes toolbar.

## What is already implemented

- Cornell Notes style layout
- draggable note boxes
- SVG links between note boxes
- cue-column text highlighting and box linking
- zoom, panning, resizable split layout
- fullscreen mode
- dark mode
- JSON export/import
- local Ollama-powered note analysis
- FastAPI backend with PostgreSQL persistence (notes, boxes, links) and Alembic migrations
- PostgreSQL Docker setup; optional `api` service in Compose

## What is not finished yet

- no frontend-to-backend API integration (save/load still file-based in the UI)
- no authentication
- no completed help/about flows
- dictation is still a placeholder
- some menu fields exist in the UI but are not yet connected to saved settings or backend behavior

## Roadmap

The planned development steps are collected in [TODO.md](TODO.md).

## Notes for contributors

- The backend folder is named `BackEnd/`, not `backend/`.
- The repository already contains a backend-specific README at [BackEnd/README.md](BackEnd/README.md).
- The root `docker-compose.yml` can start PostgreSQL and the `api` service (see `.env.example`).
- The main product behavior is currently in one large file: [frontend/script.js](frontend/script.js).

## Summary

Today, Tree Notes is primarily a browser-based visual Cornell notes editor with local file export/import and optional local Ollama analysis. A **FastAPI** backend persists notes in **PostgreSQL**; the **UI still uses files** for save/load until wired to the API.
