# SIET Question Bank & Paper Generator - AI Coding Agent Instructions

## Project Overview
A full-stack educational platform for SIET's MCA Department enabling HOD and Faculty to manage question banks, generate exam papers, and administer faculty/subject data.

**Architecture**: Multi-service backend (6 Flask microservices on ports 5000-5005) + Dual frontend (vanilla JS pages + React SPA)

---

## Critical Backend Architecture

### Multi-Service Port Mapping
Each service is independent and handles a specific domain:
- **Port 5000**: `faculty.py` - Faculty CRUD (add/edit/delete faculty, profile PDFs)
- **Port 5001**: `dashboard.py` - HOD statistics (faculty/subject/paper counts)
- **Port 5002**: `regulation.py` - Academic regulations (semesters, regulation versions)
- **Port 5003**: `subjects.py` - Subject CRUD (subject_id, code, name, semester, faculty assignment)
- **Port 5004**: `question_bank_backend.py` - QB file upload/download (PDFs stored in `uploads/{subject_id}/`)
- **Port 5005**: `generator.py` - Paper generation from QB PDFs (produces 4 paper sets)

**Start all services**: `python app.py` launches all 6 processes simultaneously.

### Database Schema (MySQL `siet_faculty_management`)
```
faculty(faculty_id PK, name, designation, password, profile_pdf path, ...)
regulations(reg_id PK, reg_name)
subjects(subject_id PK, subject_code, subject_name, regulation_id FK, semester, faculty_assign, credits)
papers(id PK, paper_name, created_at)
question_banks(id PK, subject_id, filename, uploaded_at)
```

**Critical**: Update MySQL credentials (`host`, `user`, `password`) in all Python files (currently `"Mrs.Rossi@sql"`)

---

## Frontend Architecture Patterns

### Vanilla JS Pages (Legacy)
- **Pages**: `hod_dashboard.html`, `dashbord_faculty.html`, `login.html`
- **Pattern**: Embedded HTML/CSS/JS in single files; sidebar navigation loads pages via fetch into `#content-area`
- **API clients**: `js/dashboard.js`, `js/regulation.js`, `js/questionbank.js`, etc.
- **Quirk**: Uses `http://127.0.0.1:PORT/endpoint` hardcoded URLs (not relative paths)

### React SPA (Modern)
- **Root**: `frontend/` directory with Vite build
- **Components**: `src/pages/hod/`, `src/pages/faculty/`, `src/context/AuthContext.jsx`
- **Shared styles**: `src/styles/DashboardShared.css` (replaces duplicate Dashboard.css copies)
- **Key**: React components import shared CSS, avoid page-specific CSS duplication

**Running React**: `npm run dev` in `frontend/` directory

---

## Frontend-Backend Communication

### Cross-Origin Requirements
- All Flask services have `CORS()` enabled
- Frontend fetches from `http://127.0.0.1:PORT/endpoint`
- If serving React on different origin, update API base URLs in service calls

### Common API Patterns
```javascript
// Regulations (port 5002)
GET /get_regulations → [{reg_id, reg_name}, ...]
POST /add_regulation → {reg_id, reg_name}
PUT /update_regulation → {reg_id, reg_name}
DELETE /delete_regulation/<reg_id>

// Subjects (port 5003)
GET /get_subjects?regulation=<reg_id>&semester=<sem> → [{subject_id, code, name, ...}, ...]
POST /add_subject → {subject_id, code, name, regulation_id, semester, credits}

// Question Bank (port 5004)
POST /upload_qb (multipart) → {subject_id, file}
GET /list_qb/<subject_id> → [{filename, uploaded_at}, ...]
GET /download_qb?subject_id=&filename= → binary PDF
DELETE /delete_qb?subject_id=&filename=

// Generator (port 5005)
POST /generate → {regulation_id, semester, subject_id, file (QB PDF)} → generates 4 paper sets in generated_papers/
```

---

## Project-Specific Patterns & Conventions

### File Organization
- **Root Python files**: Service entry points (one service per file)
- **`pages/hod/`, `pages/faculty/`**: Embedded HTML content loaded by main dashboard pages
- **`frontend/`**: Separate React app with its own build process
- **`static/generator.html`**: Standalone paper generator UI
- **`uploads/`**: QB PDFs organized by `subject_id` subdirectories
- **`generated_papers/`**: Output papers (Set_A, Set_B, Set_C, Set_D per generation)

### Authentication Approach
- **File-based**: `js/auth.js` checks `localStorage` for `{"role": "hod"/"faculty", "username": "..."}`
- **Demo credentials**: HOD (hod/hod123), Faculty (faculty/faculty123)
- **Protection**: Pages call `Auth.requireAuth(['hod'])` to gate access
- **Note**: No session management; authentication is client-side only (dev/demo only)

### PDF Processing
- **Upload**: Faculty/HOD uploads QB PDF (stored as timestamped filename)
- **Parsing**: Generator reads PDF text via `PyPDF2`, extracts questions
- **Generation**: `reportlab` creates 4 unique paper sets by random question selection
- **Output**: Saves as PDFs in `generated_papers/` with metadata in `uploads/` JSON

### Database Connection Pattern
Every Python service includes:
```python
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Mrs.Rossi@sql",
        database="siet_faculty_management"
    )
```
**When adding services**: Copy-paste and update credentials consistently.

---

## Build & Development Workflow

### Backend Development
1. Edit Python service file
2. Restart service: `python <service>.py`
3. Test via curl/Postman to `http://127.0.0.1:PORT/endpoint`
4. Verify MySQL connectivity (services fail silently if DB unavailable)

### React Frontend Development
1. `cd frontend && npm install` (first time)
2. `npm run dev` (starts Vite dev server on localhost:5173)
3. `npm run build` (production build to `dist/`)
4. Vite auto-refreshes on file changes

### Vanilla JS Development
1. Edit `.html` or `.js` files
2. Open in browser or serve: `python -m http.server 8080`
3. Check browser console for CORS/network errors

---

## Common Gotchas & Fixes

1. **Port already in use**: Kill process on port (e.g., `netstat -ano | findstr :5000`) or change port in service
2. **CORS errors**: Ensure Flask service has `CORS(app)` and request origin is whitelisted
3. **DB connection fails silently**: Flask returns empty JSON; check MySQL is running and credentials match all services
4. **File upload filename collisions**: `question_bank_backend.py` appends timestamp to prevent overwrites
5. **React CSS import path broken**: Use shared styles from `src/styles/` (not page-specific paths)
6. **Vanilla JS fetch hardcodes IPs**: Update all `http://127.0.0.1:PORT/` URLs if changing environment

---

## When Adding New Features

- **New data entity?** Add table to MySQL schema, create `/get_*` and `/crud_*` endpoints in new service on unused port
- **New API endpoint?** Add `@app.route()` in appropriate service, enable CORS, return JSON
- **New UI page?** Add `.html` to `pages/hod/` or `pages/faculty/`, load via `loadSection()`, link JS in `hod_dashboard.html`
- **Shared styles?** Add to `src/styles/DashboardShared.css` (React) or embed in `.html` `<style>` blocks (vanilla)
- **React component?** Place in `frontend/src/pages/` with role-based routing via `ProtectedRoute.jsx`

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `app.py` | Launcher for all 6 services |
| `generator.py` | Core paper generation logic (PDF parsing + reportlab creation) |
| `question_bank_backend.py` | File upload/download; subject folder organization |
| `hod_dashboard.html` | Main HOD UI; sidebar navigation pattern |
| `dashbord_faculty.html` | Main Faculty UI (note typo in filename) |
| `frontend/src/pages/hod/HodDashboard.jsx` | React equivalent of HOD dashboard |
| `frontend/src/context/AuthContext.jsx` | React authentication provider |
| `js/auth.js` | Client-side auth checker (localStorage-based) |
| `frontend/src/styles/DashboardShared.css` | Shared dashboard styles for both roles |

