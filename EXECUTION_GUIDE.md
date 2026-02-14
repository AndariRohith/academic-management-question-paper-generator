# Execution Guide

This guide provides steps to set up and run the Faculty Management System.

## 1. Prerequisites
Ensure you have the following installed:
- **Python** (3.8 or higher)
- **Node.js** (and `npm`)
- **MySQL Server**

## 2. Database Setup
The application requires a MySQL database.
1. Log in to your MySQL server.
2. Create a database named `siet_faculty_management`.
   ```sql
   CREATE DATABASE siet_faculty_management;
   ```
   *(If the application code handles table creation automatically, skip creating tables manually. Otherwise, you may need initial SQL scripts. Based on the code, `update_schema.py` exists but no full init script was found. Ensure the DB exists.)*
3. The code expects the following credentials (found in `dashboard.py` and others):
   - **User**: `root`
   - **Password**: `Mrs.Rossi@sql`
   - **Database**: `siet_faculty_management`
   
   *If your MySQL password differs, update the `get_db_connection` function in `dashboard.py`, `faculty.py`, `generator.py`, `question_bank_backend.py`, `regulation.py`, and `subjects.py`.*

## 3. Backend Setup
1. Open a terminal in the project root directory: `c:\Users\andar\OneDrive\Desktop\my_project`
   *(Do NOT run this inside `frontend`)*
2. Install the required Python packages:
   ```bash
   pip install flask flask-cors mysql-connector-python reportlab pypdf2 requests
   ```

## 4. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## 5. Running the Application

### Option A: Run Everything (Backend Sript)
There is an automation script `app.py` in the root directory that launches all backend services.
1. From the project root (`c:\Users\andar\OneDrive\Desktop\my_project`):
   ```bash
   python app.py
   ```
   *Note: This script launches multiple python processes (`dashboard.py`, `faculty.py`, etc.).*

2. In a separate terminal, run the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Option B: Run Services Individually
If `app.py` fails or you prefer manual control, run each service in a separate terminal from the root directory:

| Service | Command | Port |
|---------|---------|------|
| Faculty Service | `python faculty.py` | 5000 |
| Dashboard Service | `python dashboard.py` | 5001 |
| Regulation Service | `python regulation.py` | 5002 |
| Subjects Service | `python subjects.py` | 5003 |
| Question Bank Service | `python question_bank_backend.py` | 5004 |
| Generator Service | `python generator.py` | 5005 |

Then run the frontend:
```bash
cd frontend
npm run dev
```

## Troubleshooting
- **`[Errno 2] No such file or directory`**: This parsing error occurs if you try to run `python app.py` from inside the `frontend` folder. Make sure you are in the root directory (`my_project`).
- **Database Connection Error**: Verify your MySQL service is running and credentials in the python files match your local setup.
