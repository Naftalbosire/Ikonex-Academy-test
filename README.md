# 🎓 Ikonex Academy — Student Management System

A full-stack Student Management System built with **Node.js**, **React**, and **NeonDB (PostgreSQL)**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A free NeonDB account at https://neon.tech

---

## 1. Set Up NeonDB

1. Go to https://neon.tech and create a free account
2. Create a new project (e.g. `ikonex-sms`)
3. From the dashboard, copy your **connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and paste your NeonDB connection string:
```
DATABASE_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=development
```

---

## 3. Install Dependencies

```bash
# From project root
cd backend && npm install
cd ../frontend && npm install
```

---

## 4. Run Database Migrations

```bash
cd backend
npm run migrate
```

This creates all database tables and inserts the default grading scale.

---

## 5. (Optional) Seed Sample Data

```bash
cd backend
npm run seed
```

Adds sample streams, subjects, and 5 students to get started quickly.

---

## 6. Start the Application

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run start
# Opens on http://localhost:3000
```

Then visit **http://localhost:3000** in your browser.

---

## 📋 Features

| Module | Features |
|--------|----------|
| **Class Streams** | Create, view, edit, delete streams; assign/remove subjects |
| **Students** | Register, edit, delete, search students; assign to streams |
| **Subjects** | Create, edit, delete subjects with configurable score limits |
| **Assessments** | Record exam + CA scores; duplicate prevention; score validation |
| **Results** | Overall class rankings; subject performance; auto-calculated grades & positions |
| **PDF Reports** | Individual student report cards; class performance reports |
| **Grading Scale** | Configurable grade boundaries (A–F) |

---

## 🗂️ Project Structure

```
ikonex-sms/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── db/              # Pool, migrations, seed
│   │   └── routes/          # API routes
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, Modal
│   │   ├── pages/           # All page components
│   │   └── utils/           # API client
│   └── package.json
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams` | All class streams |
| POST | `/api/streams` | Create stream |
| GET | `/api/students` | All students (filter by stream) |
| POST | `/api/students` | Register student |
| GET | `/api/subjects` | All subjects |
| POST | `/api/assessments` | Record/update score |
| GET | `/api/assessments/class/:id/results` | Class rankings |
| GET | `/api/reports/student/:id` | PDF report card |
| GET | `/api/reports/class/:id` | PDF class report |

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, TanStack Query, React Router
- **Backend:** Node.js, Express
- **Database:** NeonDB (PostgreSQL via `pg`)
- **PDF Generation:** PDFKit

---

## 📝 Notes

- Score validation prevents duplicates (same student + subject + year + term)
- Grades are auto-calculated based on configurable grading scale
- Student positions are calculated using SQL `RANK()` window functions
- Soft-deletes used for students (is_active flag)
