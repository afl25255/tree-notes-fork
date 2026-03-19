# **TreeNotes – AI-Powered Linked Note-Taking Web Application**

**Project Proposal**

---

## 1. **Project Overview**

TreeNotes is an **open-source** web application designed to help students, researchers, and professionals capture, organize, and interconnect ideas effectively.

It combines the **Cornell Note-Taking Method** with a **network-based knowledge model**, where each note becomes a “node” in a graph, and relationships between ideas are represented as links between these nodes. This lets users visualize and explore how their notes and concepts relate, rather than seeing them as isolated entries.

An **AI module** powered by **Large Language Models (LLMs)** through **Ollama** will analyze note content, automatically create nodes for key ideas, and establish links between related concepts. Users can also manually create and connect notes for full control over their knowledge map.

> **Current Progress**: The project already has a **basic structure skeleton** in place, with manual notes creation and linking functionality. The next phase will focus on integrating AI-powered features, database setup, improving the UI/UX, and optimizing performance.

---

## 2. **Key Features**

### **Current Implemented Features**

* Skeleton architecture for frontend (HTML/CSS/Vanilla JS) and backend (FastAPI).
* PostgreSQL database configured for storing notes and links.
* Manual creation and linking of notes via a simple interface.
* Docker setup for running services locally.

### **Planned Features**

1. **AI-Assisted Linking** – Analyze text and auto-create relationships between concepts.
2. **Enhanced the Cornell Method Support** – Cue, note, and summary sections in every note.
3. **Graph Visualization** – Interactive network map showing relationships.
4. **Semantic Search** – Use AI to find relevant notes by meaning, not just keywords.
5. **User Interface Improvements** – More intuitive linking and navigation tools.

---

## 3. **Technical Stack**

* **Frontend:** HTML, CSS, Vanilla JavaScript
* **Backend:** FastAPI (Python) – for API endpoints, AI processing, and database access
* **Database:** PostgreSQL – for storing notes, nodes, and relationships
* **AI Processing:** LLMs via Ollama for concept extraction and relationship mapping
* **Deployment:** Docker containers for isolated, reproducible environments

---

## 4. **System Architecture**

```
[Frontend: HTML/CSS/JS]
     ↓
[Backend: FastAPI]
     ├── AI Module (Ollama LLM for Concept Linking)
     └── Database Layer (PostgreSQL)
     ↓
[Docker Environment]
```

---

## 5. **AI Functionality (via Ollama LLMs)**

The AI module will:

1. Parse and analyze note text using a locally hosted or remote LLM.
2. Identify important concepts and topics.
3. Suggest or automatically create linked nodes.
4. Enable semantic search queries.

---

## 6. **Why TreeNotes is Valuable for Students**

TreeNotes will help students:

* Organize information using a proven method (The Cornell Note-Taking).
* Discover hidden connections between concepts.
* Reduce study time through AI-assisted linking and search.
* Practice working with modern AI and web development tools.

---

## 7. **Learning Outcomes for Students**

Students contributing to TreeNotes will learn:

* **Frontend Development** with HTML/CSS/JS.
* **Backend Development** with FastAPI.
* **Database Design & SQL** with PostgreSQL.
* **AI Integration** using Ollama for semantic analysis.
* **Containerization** with Docker.
* **Agile Project Management** for long-term team projects.
* **Open Source Collaboration** through GitHub workflows.

---

## 8. **Open Source Vision**

TreeNotes will remain open source on GitHub, enabling the community to:

* Suggest new features
* Improve AI models and linking logic
* Contribute UI enhancements

---

## 9. **TreeNotes – Parallel 8-Month Timeline (minimum 4-Person Team)**

| Month | Frontend (Person A)                                | Backend (Person B)                          | AI Integration (Person C)                       | Database & DevOps (Person D)                    |
| ----- | -------------------------------------------------- | ------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| **1** | Review existing skeleton UI, refine layout plan    | Review FastAPI structure, refine API routes | Research Ollama LLM capabilities & requirements | Review PostgreSQL schema, optimize Docker setup |
| **2** | Create wireframes, improve note creation UI        | Implement enhanced note CRUD endpoints      | Build prototype text analysis with sample notes | Design final DB schema for nodes & links        |
| **3** | Add manual linking UI with drag/drop graph         | Connect manual linking endpoints to DB      | Create AI service endpoint in FastAPI           | Implement DB changes & relationships            |
| **4** | Integrate frontend calls to AI suggestion endpoint | Optimize backend for AI request handling    | Train/tune AI prompts for concept extraction    | Set up Docker multi-container orchestration     |
| **5** | Develop graph visualization component              | Support graph data retrieval API            | Implement automatic node & link creation        | Add DB indexing for fast graph queries          |
| **6** | Enhance the Cornell Method input templates            | Add semantic search endpoints               | Integrate semantic search using LLM             | Optimize queries for semantic matching          |
| **7** | UI polish, mobile-friendly layout                  | API load testing & bug fixes                | AI performance optimization & caching           | CI/CD pipeline for deployment                   |
| **8** | Final UI testing & documentation                   | Backend documentation & code cleanup        | AI usage guide & examples                       | Deployment scripts & final Docker images        |

---

### **Parallel Work Highlights**

* **Team Collaboration Points:**

  * **Monthly Syncs** to integrate work from all streams.
  * **Weekly Check-ins** to solve blockers early.
* **Shared Responsibility:** Testing and debugging will be cross-functional in months 6–8.
* **Overlap:** AI and Backend will collaborate closely from Month 3 onward for endpoint design; Frontend and Database will coordinate for efficient data visualization.

---