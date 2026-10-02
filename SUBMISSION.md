# Online Campus Event Management System - Final Submission

## Team Roster
- **Member 1 (Systems Architect & Prompt Lead):** [Name]
- **Member 2 (Frontend Engineer):** [Name]
- **Member 3 (Database & Backend Engineer):** [Name]
- **Member 4 / Shared QA (QA & Security Engineer):** [Name]

---

## Setup Instructions
1. **Frontend:** Open `index.html` in any modern web browser or serve locally using VS Code Live Server.
2. **Database:** Execute `database/schema.sql` on a SQL database instance (MySQL / PostgreSQL / MS SQL).
3. **Backend & Tests:**
   - C# Validator & Refactored Service are located in `/backend/`.
   - Unit tests are located in `/tests/`. Run unit tests using `dotnet test` in the `/tests` folder.

---

## AI Disclosure Statement
Gemini (and/or v0) was utilized during the development of this project to assist with:
- Initial architectural prompt generation and requirements analysis (Task 1).
- Generative UI layout and accessibility structure (Task 2).
- SQL DDL schema design and Mermaid.js ERD generation (Task 3).
- C# unit test generation, code security vulnerability diagnosis, and ADO.NET refactoring (Task 4).

All AI outputs were manually reviewed, tested, and updated to adhere to security best practices, WCAG guidelines, and explicit database schema constraints.

---

## Group Verification Log Table

| Task # | Identified AI Flaw / Limitation | Manual Correction Applied | Member Responsible |
| :--- | :--- | :--- | :--- |
| **Task 2** | Missing `aria-label` attributes on form inputs in AI-generated layout. | Manually added accessible WCAG attributes and form labels. | Member 2 |
| **Task 3** | AI failed to add non-clustered indexes on Foreign Key columns in SQL script. | Added `CREATE INDEX` scripts for all foreign key relationships in `schema.sql`. | Member 3 |
| **Task 4** | AI refactored `RegistrationService.cs` disposing `SqlConnection` but missed wrapping `SqlCommand` in a `using` block. | Added nested `using` statements for both connection and command to guarantee resource disposal. | Member 4 / 1 & 3 |
| **Task 4** | AI initial diagnosis missed the potential `NullReferenceException` on `ExecuteScalar().ToString()`. | Added safe null handling (`result?.ToString()`) to prevent runtime crashes when no record matches. | Member 4 / 1 & 3 |
| **Task 4** | AI unit tests used `string.Contains()` for email domain validation, allowing lookalike domains like `evil.com`. | Updated validation to strictly check `EndsWith("@univ.edu.ph")` and added test cases for lookalike domains. | Member 4 / 1 & 3 |

---

## Task 1: Requirements Analysis & Architecture Prompt
*(Insert Member 1's Prompt, Gemini Response, and 3-4 sentence Manual Grounding Evaluation here)*

## Task 3: Database ERD (Mermaid.js)
```mermaid
... (Insert Member 3's Mermaid ERD code here) ...