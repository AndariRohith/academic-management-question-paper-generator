# Project Overview: SIET Faculty Management & Automated Question Paper Generator

## 1. Project Overview
The **SIET Faculty Management System** is a robust, microservices-based application designed to streamline academic administration and automate the critical task of question paper generation. Built for educational institutions (specifically tailored for Siddharth Institute of Engineering & Technology), it bridges the gap between faculty management and examination planning. The system empowers Heads of Departments (HODs) and Faculty to manage subjects, regulations, and question banks, while its core engine automates the creation of randomized, formatted question papers, ensuring adherence to institutional standards and reducing manual effort.

## 2. Key Features

### 🎓 Role-Based Access Control
- **HOD Dashboard**: Comprehensive control over regulations, subjects, and faculty management. Ability to generate papers for any subject.
- **Faculty Dashboard**: Personalized view for faculty members to manage their assigned subjects and generate question papers for their specific courses.

### 📄 Intelligent Question Bank Management
- **PDF Upload & Parsing**: Faculty can upload question banks in PDF format. The system intelligently parses questions, extracting metadata such as:
  - Question Text
  - Marks (e.g., "[12M]")
  - Course Outcomes (CO)
  - Bloom's Taxonomy Levels (L1, L2, etc.)
- **Unit-wise Segmentation**: Automatically categorizes questions into their respective units (Unit I to V).

### ⚙️ Automated Question Paper Generator
- **Multi-Set Generation**: Generates multiple unique sets of question papers (Set A, Set B, etc.) in a single click.
- **Randomization**: Algorithms leverage seeded randomization to ensure questions are distinct across sets while maintaining balanced coverage of the syllabus.
- **Standardized formatting**: Produces high-fidelity PDFs that strictly follow the institution's examination format (Header, Time, Max Marks, Q.No alignment).

### 🛠️ Academic Administration
- **Regulation & Subject Management**: CRUD operations for academic regulations (e.g., R20) and subjects, ensuring data consistency across the institution.

## 3. Technical Highlights

### 🚀 Microservices Architecture
The backend is architected as a collection of decoupled Python Flask services, orchestrating distinct domains:
- **`dashboard.py`**: Manages user dashboards and authentication logic.
- **`faculty.py`**: Handles faculty data and assignments.
- **`generator.py`**: The computationally intensive core that handles PDF parsing (PyPDF2) and generation (ReportLab).
- **`subjects.py` & `regulation.py`**: Dedicated services for academic metadata.
This modularity ensures that heavy processing (like PDF generation) does not block user interactions in other parts of the system.

### 🧩 Advanced PDF Processing
- **Custom Regex Parsers**: A sophisticated regex engine (`generator.py`) identifies and extracts complex question patterns, including nested sub-questions, "OR" conditions, and metadata tags effectively from unstructured PDF text.
- **ReportLab Integration**: Utilizes the ReportLab library for pixel-perfect PDF generation, drawing dynamic headers, tables, and text wrapping that matches the official exam paper templates.

### 💻 Modern Frontend
- **React & Vite**: Built with React for a dynamic, single-page application (SPA) experience, powered by Vite for lightning-fast development and build performance.
- **Responsive Design**: Ensuring accessibility across devices for faculty on-the-go.

## 4. Impact and Scalability

### 📉 Impact
- **80% Time Reduction**: Transforms the manual, error-prone process of setting question papers (often taking hours) into a few clicks details.
- **Standardization**: Eliminates formatting inconsistencies. Every generated paper is guaranteed to adhere to the institution's strict layout and font guidelines.
- **Data Integrity**: Centralized management of subjects and question banks prevents data silos and ensures that only approved, up-to-date curricula are used for exams.

### 📈 Scalability
- **Horizontal Scaling**: The microservices architecture allows individual components (like the CPU-intensive `generator.py`) to be scaled independently. If demand peaks during exam season, the generator service can be replicated without duplicating the entire stack.
- **Database efficiency**: MySQL provides a relational structure that can easily handle thousands of subjects, faculty members, and archived question papers.
- **Modular Codebase**: New modules (e.g., Student Result Analysis) can be added as new microservices without disrupting the existing ecosystem.
