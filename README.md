# 🎓 PACE Classroom — Complete Setup Guide

## Project Structure

```
pace-classroom/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Register, Login, GetMe
│   │   ├── sessionController.js   # CRUD sessions, enroll, learners
│   │   ├── quizController.js      # Create quiz, submit, results
│   │   ├── engagementController.js# Log events, fetch scores
│   │   ├── reportController.js    # PDF report generation
│   │   └── adminController.js     # User management
│   ├── middleware/
│   │   └── auth.js                # JWT protect + role authorize
│   ├── routes/
│   │   └── index.js               # All API routes
│   ├── reports/                   # Generated PDF reports (auto-created)
│   ├── database.sql               # Complete MySQL schema + seed
│   ├── server.js                  # Express + Socket.io server
│   ├── .env.example               # Environment variables template
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Admin/
        │   │   └── AdminDashboard.js      # User & session overview
        │   ├── Trainer/
        │   │   ├── TrainerDashboard.js    # Session stats + charts
        │   │   ├── CreateSession.js       # 3-step session creator
        │   │   └── LiveSessionManager.js  # Real-time session control
        │   ├── Learner/
        │   │   ├── LearnerDashboard.js    # Progress + radar chart
        │   │   └── LearnerSession.js      # Live session viewer + quiz
        │   └── Shared/
        │       └── Sidebar.js             # Role-based navigation
        ├── context/
        │   └── AuthContext.js             # Global auth state
        ├── pages/
        │   ├── Login.js
        │   └── Register.js
        ├── utils/
        │   └── api.js                     # Axios instance + interceptors
        ├── App.js                         # Routes + Protected layout
        ├── index.js
        └── index.css                      # Full design system
```

---

## ⚙️ Prerequisites

- Node.js v16+
- MySQL 8.0+
- npm or yarn

---

## 🚀 Step-by-Step Setup

### Step 1: Clone / Download the project

```bash
cd pace-classroom
```

### Step 2: Set up MySQL Database

Open MySQL Workbench or terminal:

```sql
mysql -u root -p
```

Then run the schema file:

```bash
mysql -u root -p < backend/database.sql
```

This creates the `pace_classroom` database with all 14 tables and a default admin user.

---

### Step 3: Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pace_classroom
JWT_SECRET=any_long_random_string_here
```

Install dependencies and start:

```bash
npm install
npm run dev
```

Backend runs on: **http://localhost:5000**

---

### Step 4: Start Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: **http://localhost:3000**

---

## 🔑 Default Login

| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@pace.com     | admin123   |

To create trainer/learner accounts, use the Register page or insert directly:

```sql
-- Create a Trainer
INSERT INTO users (name, email, password, role, department)
VALUES ('Jane Trainer', 'trainer@pace.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trainer', 'HR');

-- Create a Learner
INSERT INTO users (name, email, password, role, department)
VALUES ('John Learner', 'learner@pace.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'learner', 'Sales');
```
(Password for both: `admin123`)

---

## 📡 API Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Any | Get current user |
| GET | /api/sessions | Any | Get sessions by role |
| POST | /api/sessions | Trainer/Admin | Create session |
| GET | /api/sessions/:id | Any | Get session details |
| PUT | /api/sessions/:id/status | Trainer/Admin | Update status |
| POST | /api/sessions/:id/enroll | Learner | Enroll in session |
| GET | /api/sessions/:id/learners | Trainer/Admin | Get enrolled learners |
| GET | /api/sessions/all | Learner | Explore all sessions |
| POST | /api/sessions/content | Trainer/Admin | Add content |
| POST | /api/quizzes | Trainer/Admin | Create quiz |
| GET | /api/quizzes/:id | Any | Get quiz |
| POST | /api/quizzes/:id/submit | Learner | Submit answers |
| GET | /api/quizzes/:id/results | Trainer/Admin | Quiz results |
| POST | /api/engagement/log | Any | Log engagement event |
| GET | /api/engagement/session/:id | Trainer/Admin | Session engagement |
| GET | /api/engagement/learner/me | Learner | My engagement |
| POST | /api/reports/generate/:id | Trainer/Admin | Generate PDF report |
| GET | /api/reports/download/:file | Any | Download report |
| GET | /api/admin/users | Admin | All users |
| PUT | /api/admin/users/:id/toggle | Admin | Toggle active status |

---

## 🔌 Socket.io Events

| Event (Emit) | Who | Description |
|---|---|---|
| `join_session` | All | Join session room |
| `content_update` | Trainer | Push content to learners |
| `launch_quiz` | Trainer | Start quiz for learners |
| `launch_poll` | Trainer | Start poll |
| `engagement_event` | Learner | Send engagement signal |
| `ask_question` | Learner | Submit question to trainer |
| `poll_response` | Learner | Submit poll answer |
| `chat_message` | All | Live chat |

| Event (Listen) | Who | Description |
|---|---|---|
| `learner_joined` | Trainer | New learner joined |
| `content_changed` | Learner | Content updated by trainer |
| `quiz_started` | Learner | Quiz launched |
| `poll_started` | Learner | Poll launched |
| `engagement_update` | Trainer | Real-time engagement score |
| `new_question` | Trainer | Question submitted |
| `new_chat` | All | New chat message |

---

## 🗃️ Database Tables (14 Tables)

| # | Table | Purpose |
|---|-------|---------|
| 1 | users | All users (admin/trainer/learner) |
| 2 | sessions | Training sessions |
| 3 | session_content | Content per session |
| 4 | enrollments | Learner-session mapping |
| 5 | attendance | Attendance tracking |
| 6 | quizzes | Quiz definitions |
| 7 | quiz_questions | Individual questions |
| 8 | quiz_responses | Learner answers + scores |
| 9 | polls | Live polls |
| 10 | poll_responses | Poll answers |
| 11 | engagement_logs | All engagement events |
| 12 | live_questions | Q&A from learners |
| 13 | reports | Generated report metadata |
| 14 | notifications | User notifications |

---

## 🧪 Testing the Flow

1. **Login as Trainer** → Create a session with content + quiz
2. **Login as Learner** → Go to Explore → Enroll in the session
3. **Trainer** → Open session → Click "Go Live"
4. **Learner** → Session appears LIVE → Click "Join Now"
5. **Trainer** → Launch a quiz from the Quizzes tab
6. **Learner** → Quiz popup appears → Submit answers
7. **Trainer** → View real-time engagement scores
8. **Trainer** → Click "Report" to generate a PDF

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Charts | Recharts |
| Real-time | Socket.io Client |
| HTTP | Axios |
| Backend | Node.js + Express |
| Real-time | Socket.io Server |
| Database | MySQL 8 + mysql2 |
| Auth | JWT + bcryptjs |
| PDF | PDFKit |
| Styling | Custom CSS Design System |
