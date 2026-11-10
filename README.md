# LearnOS — AI-Powered Autonomous Student Learning & Career Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-React%2018%20%7C%20Vite%20%7C%20Node.js%20%7C%20Express-indigo.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

LearnOS is a full-stack student learning and career development platform built with React 18, TypeScript, Vite, Tailwind CSS, Node.js, and Express.

- **Live Frontend (GitHub Pages)**: [https://shashank-785.github.io/TEAMBREAK/](https://shashank-785.github.io/TEAMBREAK/)
- **Production Backend API (Render)**: [https://learnos-backend-ks49.onrender.com/](https://learnos-backend-ks49.onrender.com/)

---

## 🎨 Design System

Engineered with high-contrast, modern dark ergonomics:

| Element | Color Hex | Visual Description |
| :--- | :--- | :--- |
| **Background** | `#0B0D12` | Deep space obsidian black |
| **Cards** | `#151923` | Charcoal slate surface |
| **Card Hover** | `#1C2230` | Subtle elevation border |
| **Borders** | `#232936` | Sleek border lines |
| **Accent** | `#6366F1` | Electric Indigo (Brand Primary) |
| **Main Text** | `#F8FAFC` | Crisp white typography |
| **Secondary Text** | `#94A3B8` | Muted slate gray |
| **Font** | `Inter` / `JetBrains Mono` | Responsive variable font |

---

## 🏛️ Autonomous Agent Roles

The application is engineered across 6 modular domains:

| Agent | Isolated Responsibility | Modules Implemented |
| :--- | :--- | :--- |
| **ATLAS** | Frontend Architecture & Layout | Dashboard (1), AI Assistant (8), Analytics (9), Profile/Settings (10), Layout & Shared UI |
| **NOVA** | Academic Core & Documents | College Tutor (2), Notes & Documents (4), Exam Centre (5) |
| **ORBIT** | Productivity & Study Cycles | Study Planner (3), Timetable Grid, Spaced Repetition, Pomodoro Timer |
| **FORGE** | Coding & Career Development | Coding Lab (6), Sandbox Execution, Skill Trees (7), AI Mock Interview |
| **KERNEL** | Backend, Database & AI Core | Express API, multi-user isolated persistence, centralized multi-provider AI engine |
| **SENTINEL** | Security, Testing & Health | E2E Test Harness (`api.test.ts` & `frontend.test.mjs`), Public/Protected Health Probes |

---

## 📦 Project Modules

1. **Dashboard (ATLAS)**: Real-time GPA tracker, study hours, coding problem statistics, today's schedule, real upcoming tasks, recent activity feed, and subject mastery meters.
2. **College Tutor & Syllabus (NOVA)**: 6 core Computer Science subjects (`CS301` Data Structures & Algorithms, `CS302` Operating Systems, `CS303` Database Management Systems, `CS304` Computer Networks, `MA301` Discrete Mathematics, `CS305` Artificial Intelligence & Machine Learning), unit-by-unit syllabus trees, subtopics, learning objectives, practice questions, revision resources, custom university topic support, and a multi-turn context-aware AI tutor (Feynman, Socratic, Code Example, and Analogy modes).
3. **Study Planner (ORBIT)**: Weekly class timetable (add/delete blocks), Kanban task sprint board (create/edit/move/delete), SuperMemo SM-2 spaced repetition queue, and Pomodoro focus timer with Web Audio ambient synthesizer.
4. **Notes & Documents (NOVA)**: Markdown note manager with folder organization (`Exam Prep`, `Interview Prep`, `Lecture Notes`, `Quick Revision`), `.txt`/`.md`/`.json` document upload, one-click AI study summarizer, and AI-generated MCQs & flashcards saved directly to Exam Centre.
5. **Exam Centre (NOVA)**: Subject-filtered quizzes with score history persistence, 3D flip flashcards with custom flashcard creation, timed mock exams, and 2021–2025 university PYQ bank with step-by-step model solutions.
6. **Coding Lab (FORGE)**: Multi-language IDE (Python, JavaScript, C++, Java) backed by an isolated Piston execution sandbox (with safe client-side Web Worker JS/TS fallback), custom `stdin` input, persistent saved code per problem & language, test-case verifier, and AI coding mentor.
7. **Skill Development (FORGE)**: Visual career roadmaps (Full-Stack AI Engineer, Machine Learning Specialist, Systems & Cloud Architect) with enforced prerequisite chains and an interactive AI Technical Mock Interview Simulator with rubric scoring.
8. **AI Assistant (ATLAS/KERNEL)**: Centralized academic and career assistant with multi-conversation persistence, real-time SSE streaming, note/task context injection, and 1-click prompt templates.
9. **Analytics & Achievements (ATLAS/SENTINEL)**: 100% real data-driven weekly study charts, problem difficulty breakdown, 30-day activity streak calendar, quiz accuracy tracking, and unlockable gamification badges.
10. **Profile, Settings & Help (ATLAS/KERNEL)**: Full academic profile management (University, Degree, Branch, Semester, Enrolled Subjects, Learning & Career Interests), AI provider status & diagnostics, and operator documentation.

---

## 🧠 Centralized AI Architecture

LearnOS implements a single, centralized backend AI architecture (`server/src/services/ai.ts`) so **students never need to install models or configure personal API keys**:

1. **Remote Cloud Inference (Recommended for Render / Cloud Hosting)**:
   - Supports **Google Gemini** (`GEMINI_API_KEY`), **Groq** (`GROQ_API_KEY`), **OpenRouter** (`OPENROUTER_API_KEY`), or any **OpenAI-compatible endpoint** (`OPENAI_API_KEY` / `AI_API_KEY` + `AI_BASE_URL`).
   - Built-in request timeouts (`25s`), per-user rate limiting, and backend-only secret management.
2. **Local Inference (`node-llama-cpp` GGUF or Ollama)**:
   - Supports local embedded **Qwen3-1.7B Q8_0 GGUF** via `node-llama-cpp` (`npm run setup:model`) or local Ollama (`OLLAMA_BASE_URL`).
3. **Structured Academic Fallback Engine**:
   - If neither remote cloud credentials nor local GGUF weights are active, LearnOS automatically falls back to its built-in **Academic Curriculum Engine**, ensuring College Tutor explanations, Note Summarization, MCQ/Flashcard generation, Mock Interview evaluations, and AI Assistant responses remain 100% functional without errors.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (`v20.0.0` or higher)
- npm (`v9.0.0` or higher)

### Installation
```bash
# Install workspace dependencies (client + server)
npm ci
```

### Environment Setup
Copy `server/.env.example` to `server/.env` and generate a 32-byte `AUTH_SECRET`:
```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```
Optionally configure `GEMINI_API_KEY` or `GROQ_API_KEY` in `server/.env` for cloud AI inference, or run `npm run setup:model` to download the local 1.83 GB Qwen3-1.7B GGUF model.

### Running Locally
```bash
# Start Backend API (Port 5000)
npm run dev:server

# In a second terminal, start Vite Client (Port 5173)
npm run dev:client
```
- Frontend: `http://localhost:5173`
- Public Health Check: `http://localhost:5000/api/system/health`

### Building & Testing for Production
```bash
# Run full backend E2E (12 suites) and frontend verification (4 suites)
npm test

# Type-check and build both client and server
npm run build

# Publish production client bundle to docs/ for GitHub Pages
npm run publish:pages
```

---

## 🔒 Security & Data Architecture
- **Multi-User Per-Account Isolation**: Every registered student receives an isolated account partition (`subjects`, `tasks`, `schedules`, `revisions`, `notes`, `flashcards`, `quizAttempts`, `savedCode`, `roadmaps`, `conversations`, `interviews`, `studyHistory`, `achievements`).
- **Protected `server/data/learnos.json`**: Pre-existing repository seed data in `server/data/learnos.json` is strictly preserved; runtime multi-user mutations are written atomically to `server/data/learnos.runtime.json` (or `LEARNOS_DATA_DIR`).
- **Signed Session Tokens & Revocation**: `scrypt` password hashing with timing-safe comparison, HMAC-SHA256 signed session tokens, and server-side token revocation on logout.
- **Public vs. Protected System Routes**: `/api/system/health` exposes only safe public readiness status; detailed internal diagnostics (`/api/system/diagnostics`) require authentication.
- **Sandboxed Code Execution**: Student code is never executed inside the Express server process.
