# AI--Assisted-API-Test-Generation-Platform

# Automated Requirement, Acceptance Criteria & Test Case Generation Pipeline with Real-Time Results Dashboard

An AI-driven API test generation platform that automates the transformation of raw Business Requirement Documents (BRDs) into structured requirements, Acceptance Criteria, and executable Pytest test scripts.

The platform uses LangChain and LangGraph to orchestrate the AI workflow and supports local Large Language Model (LLM) inference through Ollama. Generated test scripts can be automatically committed to a GitHub repository, enabling integration with existing CI/CD workflows.

---

## Overview

Traditional API testing requires QA engineers to manually analyze requirements, define Acceptance Criteria, write test scenarios, and implement automated test scripts.

This platform aims to automate that process.

The system takes a raw BRD or requirement document as input and processes it through an AI-powered workflow:

BRD → Requirement Extraction → Acceptance Criteria → Pytest Generation → GitHub Commit → CI/CD

This reduces manual effort and provides a repeatable approach for generating API automation tests.

### Workflow

BRD → Requirement Extraction → Acceptance Criteria Generation → Pytest Generation → GitHub Auto Commit → CI/CD Deployment

---

## Key Features

- Upload raw BRDs (PDF, DOCX, TXT)
- Extract requirements using LangChain
- Parallel map-reduce orchestration using LangGraph
- Generate structured Acceptance Criteria
- Generate executable Pytest scripts
- Auto-commit generated tests to GitHub
- React + TypeScript dashboard
- FastAPI backend with Uvicorn
- Local LLM execution through Ollama (Qwen models)

---

## Architecture

    React UI
                        │
                        ▼
                   FastAPI API
                        │
                        ▼
                  Upload BRD PDF
                        │
                        ▼
                PDF Text Extraction
                        │
                        ▼
          LangGraph Orchestrator
                        │
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
Requirement      Ticket Agent     Validation
    Agent
        │
        ▼
Acceptance Criteria Agent
        │
        ▼
Test Case Agent
        │
        ▼
Test Script Agent
        │
        ▼
   Git Push Agent



### Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React, TypeScript, Vite |
| Backend | FastAPI, Uvicorn |
| AI Orchestration | LangChain, LangGraph |
| LLM | Ollama (Qwen 3B / 7B / 14B) |
| Testing | Pytest |
| CI/CD | GitHub Actions |
| Deployment | Github Repo |

---

## Repository Structure


Frontend/     React UI
Backend/      FastAPI + LangGraph pipeline
Prompts/      LLM prompt templates
Generated/    AI-generated outputs
Docs/         Architecture and progress documents
.Github/      CI/CD workflows


---

## Phase-wise Progress

### Phase 1 – Frontend Foundation
- React + TSX setup
- Dashboard UI
- Upload interface
- Responsive styling

### Phase 2 – Frontend ↔ Backend Integration
- REST API integration
- FastAPI connection
- Uvicorn setup
- Real-time response rendering

### Phase 3 – AI Pipeline
- BRD extraction
- LangGraph orchestration
- Parallel map-reduce processing
- Acceptance Criteria generation

### Phase 4 – Test Automation
- Pytest generation
- File formatting
- Output persistence

### Phase 5 – GitHub & CI/CD
- Auto-commit generated tests
- GitHub Actions integration
- Deployment-ready workflow

---

## Local Setup

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/<your-username>/ai-cicd-qa-automation-pipeline.git
cd ai-cicd-qa-automation-pipeline
\`\`\`

### 2. Start Ollama

\`\`\`bash
ollama serve
ollama pull qwen2.5:7b
\`\`\`

### 3. Backend

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
\`\`\`

### 4. Frontend

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/brd/upload | Upload BRD |
| POST | /api/ac/generate | Generate Acceptance Criteria |
| POST | /api/pytest/generate | Generate Pytest scripts |
| POST | /api/github/commit | Commit generated tests |

---

## AI Pipeline

### LangGraph Flow

\`\`\`
Extract Requirements
        ↓
Parallel Map Nodes
        ↓
Reduce & Merge
        ↓
Generate Acceptance Criteria
        ↓
Generate Pytest Scripts
        ↓
Commit to GitHub
\`\`\`

---

## Generated Output

\`\`\`
generated/
├── acceptance-criteria/
│   └── login_ac.md
└── pytest-scripts/
    └── test_login.py
\`\`\`

---

## GitHub Automation

Generated test scripts are automatically committed to the configured repository branch.

Example:

\`\`\`
feat(ai-tests): add generated pytest scripts for login module
\`\`\`

---

## Environment Variables

Create a \`.env\` file from \`.env.example\`.

\`\`\`env
OLLAMA_BASE_URL=http://localhost:3000
OLLAMA_MODEL=qwen2.5:3b
GITHUB_TOKEN = ghp_i0IUZ1DEZswx3Y6n7sYIklTHro7GHw13Y9ZFr
GITHUB_REPO = Test_case_automation
GIT_REPO_OWNER=NaveenMoorthy19
GITHUB_BRANCH=main
\`\`\`

---

## Future Enhancements

- RAG with vector database
- Jira integration
- Test coverage analysis
- Selenium/Playwright generation
- Multi-model evaluation
- Streaming responses
- Kubernetes deployment

---

## Demo

See -- https://docs.google.com/document/d/1GxjRb2vOZc_RjPjQHOmEpBD4wLuSOtZr9UhFT6wO06k/edit?tab=t.0

---

## Author

**Naveen Moorthy**

AI / Agentic AI / GEN AI DEVOLOPER

---

## License

This project is licensed under the MIT License.
