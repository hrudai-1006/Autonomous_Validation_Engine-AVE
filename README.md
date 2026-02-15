# AVE - Autonomous Validation Engine

A full-stack system for autonomous provider data validation using an agentic workflow.

## 🚀 Features
- **Dashboard**: Real-time metrics and agent validation stream.
- **Provider Registry**: Searchable database of providers.
- **Validation Report**: Detailed side-by-side comparison of source vs registry data with confidence scoring.
- **Agentic Workflow**:
  - **Extraction Agent**: Simulates parsing uploaded files.
  - **Enrichment Agent**: Simulates interacting with CMS NPI Registry.
  - **QA Agent**: Performs logic checks and scores confidence.
  - **Orchestrator**: Manages the flow.
- **Dummy Mode**: Runs locally with seeded data and simulated external APIs.

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), SQLite, SQLAlchemy.
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, TanStack Query.
- **State**: Backend-driven (Polled).

## 🏃‍♂️ Quick Start

### 1. Backend Setup
The backend runs on port `8000`.

```bash
cd backend

# Install Dependencies
pip install -r requirements.txt

# Seed Dummy Data (Important for Dummy Mode)
python seed_data.py

# Start Server
uvicorn app.main:app --reload
```
*Verify running at: http://localhost:8000*

### 2. Frontend Setup
The frontend runs on port `5173`.

```bash
cd frontend

# Install Dependencies
npm install

# Start Dev Server
npm run dev
```
*Open App: http://localhost:5173*

## 🧪 Testing the Flow
1. **Upload**: On the Dashboard, click the upload area (or drag a file).
2. **Watch**: Observe the "Agent Execution Stream" on the right populate with logs.
3. **Review**: Click "Review" on any provider row or use the Registry to view details.
4. **Config**: Go to Settings to toggle "Fuzzy Matching" (simulation).

## 📂 Project Structure
- `backend/app/agents`: Core logic (Extraction, Enrichment, QA, Orchestrator).
- `frontend/src/pages`: UI Screens (Dashboard, Registry, Config).
- `ave.db`: Local SQLite database (created on startup).
