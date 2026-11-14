
<div align="center">

# LearnOS — AI-Powered Student Learning & Career Platform

**One workspace for studying smarter, practising code, preparing for exams, and building career-ready skills.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Live Demo](https://shashank-785.github.io/TEAMBREAK/) · [Repository](https://github.com/shashank-785/TEAMBREAK)

</div>

---

## 📌 1. Problem Statement: Fragmented Student Learning

Students often have to switch between separate tools to manage their academic and career development:

1. **Scattered study resources:** Notes, syllabus material, revision content, and practice questions live in different places.
2. **Disconnected productivity workflows:** Timetables, assignments, revision schedules, and focus sessions are difficult to coordinate.
3. **Limited hands-on practice:** Students need a convenient place to practise programming, check solutions, and prepare for technical interviews.
4. **Weak progress visibility:** Without a unified view of study activity, quiz performance, and completed goals, it is harder to identify what needs attention.

LearnOS brings these workflows together in one student-focused platform.

## ⚡ 2. What is LearnOS?

LearnOS is a full-stack learning and career development application built with a React and TypeScript frontend and a Node.js/Express backend.

It combines academic support, study planning, document-based revision, coding practice, skill roadmaps, and progress analytics in one interface.

### Core Design Goals

- **Unified workspace:** Keep essential student workflows accessible from one dashboard.
- **Practical learning:** Combine explanations with quizzes, flashcards, coding exercises, and mock interviews.
- **AI-assisted study:** Provide tutor and assistant experiences supported by the configured local inference runtime.
- **Progress awareness:** Present study activity, quiz performance, and achievements in a single place.

## 🧩 3. Platform Modules

| Module | Capabilities |
|---|---|
| **Dashboard** | Study overview, schedule, tasks, activity, and progress indicators |
| **College Tutor** | Subject-based learning, syllabus topics, explanations, and practice support |
| **Study Planner** | Timetable, task board, spaced repetition, and Pomodoro focus timer |
| **Notes & Documents** | Organised notes, document upload, summaries, MCQs, and flashcards |
| **Exam Centre** | Quizzes, flashcards, mock exams, score history, and previous-year questions |
| **Coding Lab** | Programming workspace for Python, JavaScript, C++, and Java |
| **Skill Development** | Career roadmaps and technical mock interview practice |
| **AI Assistant** | Conversational academic and career assistance |
| **Analytics** | Study activity, quiz accuracy, coding progress, and achievements |
| **Profile & Settings** | Academic profile and application configuration |

## 🏗️ 4. System Architecture

LearnOS is organised as an npm workspace monorepo.

```text
TEAMBREAK/
├── client/                 # React + TypeScript + Vite frontend
│   └── src/
│       ├── components/     # Shared UI components
│       ├── pages/          # Feature pages
│       ├── services/       # API communication
│       └── types/          # Shared TypeScript contracts
│
├── server/                 # Express + TypeScript backend
│   └── src/
│       ├── routes/         # Backend route handlers
│       └── services/       # Application services
│
├── agents/                 # Agent-related project modules
├── docs/                   # Project documentation
├── scripts/                # Build and publishing scripts
├── package.json            # Workspace scripts
└── README.md
```

### Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3 |
| Backend | Node.js, Express, TypeScript |
| Workspace | npm workspaces |
| AI runtime | Local Qwen3-1.7B GGUF inference using `node-llama-cpp` |
| Persistence | JSON-file-based application storage |
| Code execution | Optional isolated Piston-compatible sandbox endpoint |
| Deployment | GitHub Pages frontend; separately hosted backend |

## 🧠 5. AI Inference Architecture

LearnOS is designed to run its configured language model locally on the backend host.

### Local Model Workflow

1. The frontend sends an AI-assisted task to the backend.
2. The backend AI service handles the request.
3. The configured Qwen3-1.7B Q8_0 GGUF model is loaded through `node-llama-cpp`.
4. The generated result is returned to the application.

### Model Setup

```bash
npm run setup:model
```

The deployment guide documents a model download of approximately 1.83 GB into the user's local model directory, outside the repository.

> **Runtime note:** AI generation requires the model files and native runtime to be available on the backend host. If they are missing, the server reports AI as unavailable rather than presenting placeholder generated responses.

## 🔐 6. Data, Security & Current Limitations

The following implementation details are important when running or deploying LearnOS:

- **Storage model:** The current integration report describes JSON-file-based persistence.
- **Single-user limitation:** The current storage design does not provide per-user ownership isolation. Do not deploy it as a multi-user service containing private student data until this is implemented.
- **Authentication secret:** Configure a unique `AUTH_SECRET` with at least 32 bytes for authenticated API sessions.
- **Secret handling:** Keep real environment values in `server/.env`; never commit secrets.
- **AI availability:** Local inference depends on the model weights and native runtime being installed on the backend host.
- **Code execution:** An isolated Piston-compatible sandbox endpoint must be configured; code execution is not available by default.

## 🛠️ 7. Installation & Quick Start

### Prerequisites

- Node.js
- npm
- Git

### Step 1 — Clone the Repository

```bash
git clone https://github.com/shashank-785/TEAMBREAK.git
cd TEAMBREAK
```

### Step 2 — Install Dependencies

```bash
npm ci
```

### Step 3 — Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Set a unique `AUTH_SECRET`. Generate one with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Review the other settings in `server/.env.example` before starting the backend.

### Step 4 — Set Up the Local AI Model

```bash
npm run setup:model
```

This is a one-time setup on the machine hosting the backend.

### Step 5 — Start the Backend

```bash
npm run dev:server
```

### Step 6 — Start the Frontend

Open a second terminal in the project root:

```bash
npm run dev:client
```

Open the local frontend URL shown by Vite (the deployment guide uses `http://localhost:5173`).

## 🧪 8. Build & Test

Run the test suites:

```bash
npm test
```

Build the frontend and backend:

```bash
npm run build
```

Build only the frontend:

```bash
npm run build:client
```

Build only the backend:

```bash
npm run build:server
```

## 🌐 9. Deployment

The frontend and backend are deployed separately:

- **Frontend:** [GitHub Pages](https://shashank-785.github.io/TEAMBREAK/)
- **Backend:** [LearnOS API on Render](https://learnos-backend-ks49.onrender.com/)

For self-hosting, deploy the Express backend on a host that can store and load the local model. Configure the frontend origin in `CORS_ORIGINS` and set `LEARNOS_MODEL_PATH` if the model is stored at a custom location.

**Important:** GitHub Pages can host the frontend, but it cannot host the Express API or run the local language model. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) before deploying.

## 🗺️ 10. Application Routes

| Route | Section |
|---|---|
| `/` | Dashboard |
| `/tutor` | College Tutor |
| `/planner` | Study Planner |
| `/notes` | Notes & Documents |
| `/exams` | Exam Centre |
| `/coding` | Coding Lab |
| `/skills` | Skill Development |
| `/assistant` | AI Assistant |
| `/analytics` | Analytics |
| `/settings` | Profile & Settings |

## 📚 11. Project Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Integration Report](INTEGRATION_REPORT.md)
- [Test Report](TEST_REPORT.md)

## 🤝 12. Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes and test them.
4. Open a pull request with a clear description of the changes.

## 📄 License

This project is distributed under the MIT License. See the `LICENSE` file if included in the repository.

---

<div align="center">

**LearnOS — Learn. Practise. Improve. Build your future.**

Built for students.

</div>

