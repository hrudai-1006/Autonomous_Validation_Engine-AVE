# Tech Stack & File Manifest

This document outlines the technologies, libraries, and key concepts used in the core files of the Autonomous Validation Engine (AVE).

## 🖥️ Backend (Python / FastAPI)

The backend is built with **FastAPI** for high performance and **SQLAlchemy** for ORM-based database interactions.

### Core System
| File | Technologies Used | Purpose |
|------|-------------------|---------|
| **`app/main.py`** | `FastAPI`, `Uvicorn`, `python-dotenv`, `Lifespan Events` | Entry point of the application. Configures CORS, loads environment variables, and manages database connection lifecycles. |
| **`app/database.py`** | `SQLAlchemy` (ORM), `psycopg2` (PostgreSQL Driver) | Manages database sessions, connection pooling, and the declarative base for models. |
| **`app/models.py`** | `SQLAlchemy` | Defines the database schema (tables) as Python classes (`Provider`, `Validation`, etc.). |
| **`app/schemas.py`** | `Pydantic` | Defines data validation models (DTOs) for API request and response bodies. |

### Agents (The "Brain")
| File | Technologies Used | Purpose |
|------|-------------------|---------|
| **`agents/orchestrator.py`** | `asyncio` (Concurrency), `Native Python` | Manages the workflow pipeline: Extraction → Enrichment → QA. Handles error propagation and logging. |
| **`agents/extraction.py`** | `Google Generative AI` (Gemini), `OCR Concepts` | Uses LLMs to parse unstructured files (PDF/Images) into structured JSON data. |
| **`agents/enrichment.py`** | `Google Generative AI` (Simulation), `Fuzzy Logic` | Simulates an external API (NPI Registry) query using AI to generate realistic registry data. |
| **`agents/qa.py`** | `Fuzzy Matching`, `Rule-based Scoring` | Compares extracted data vs. registry data to calculate confidence scores and identify discrepancies. |

### API Routers
| File | Technologies Used | Purpose |
|------|-------------------|---------|
| **`routers/api.py`** | `FastAPI Router`, `BackgroundTasks` | Handles core business logic: file uploads, triggering validation, and fetching registry data. |
| **`routers/system.py`** | `FastAPI Router`, `os/dotenv` | Manages system-level operations: secrets management, connection checks, and configuration updates. |

---

## 🎨 Frontend (React / Vite)

The frontend is a Single Page Application (SPA) built with **React** and **TypeScript**, styled with **Tailwind CSS**.

### Core Infrastructure
| File | Technologies Used | Purpose |
|------|-------------------|---------|
| **`src/main.tsx`** | `React DOM`, `Vite` | Application entry point. Mounts the React app to the DOM. |
| **`src/App.tsx`** | `React Router DOM` | Handles client-side routing (navigation) between different pages. |
| **`src/api/client.ts`** | `Axios` (HTTP Client) | Centralized API client for communicating with the backend (HTTP GET/POST/PUT/DELETE). |

### Pages
| File | Technologies Used | Purpose |
|------|-------------------|---------|
| **`pages/Dashboard.tsx`** | `TanStack Query` (State), `Lucide React` (Icons) | Main landing page. Displays live stats, drag-and-drop upload, and recent activity. |
| **`pages/Registry.tsx`** | `TanStack Query`, `Tailwind CSS` (Filters) | Searchable data table of all providers with status filters and delete actions. |
| **`pages/SecretsManager.tsx`** | `React State`, `Lucide React` | Secure UI for updating API keys and standardizing DB connections (PostgreSQL). |
| **`pages/ConfidenceExplainer.tsx`** | `TanStack Query` (Dynamic Data), `Math logic` | Educational page that dynamically calculates and explains how the system scores confidence. |
| **`pages/Configuration.tsx`** | `React State`, `TanStack Mutation` | Settings page to adjust system thresholds and simulation modes. |

### UI Components
| File | Technologies Used | Purpose |
|------|-------------------|---------|
| **`components/AgentExecutionStream.tsx`** | `React Hooks` (Polling), `Framer Motion` (Animations) | Visualizes the real-time "thoughts" and logs of the backend agents. |
| **`components/ValidationReportPanel.tsx`** | `Tailwind CSS` (Slide-over), `JSON Rendering` | Detailed view of a specific validation result, showing side-by-side data comparison. |

## 🗄️ Database (PostgreSQL)
*   **Hosted on:** Supabase
*   **Driver:** `psycopg2-binary`
*   **Connection:** Uses Connection Pooler (Port 6543) for reliable IPv4 connectivity.
