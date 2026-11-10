# LearnOS — AI-Powered Autonomous Student Learning & Career Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/platform-React%2018%20%7C%20Vite%20%7C%20Node.js%20%7C%20Express-indigo.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

LearnOS is a student learning and career development workspace built with React, TypeScript, Vite, Node.js, and Express. Its AI tutor uses an open-weight model through an in-process llama.cpp runtime; it does not call an external inference API.

---

## 🎨 Design System

Engineered with high contrast, modern dark ergonomics:

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

The application was engineered with 6 isolated agent responsibilities:

| Agent | Isolated Responsibility | Modules Implemented |
| :--- | :--- | :--- |
| **ATLAS** | Frontend Architecture & Layout | Dashboard (1), AI Assistant (8), Analytics (9), Profile/Settings (10), Layout & Shared UI |
| **NOVA** | Academic Core & Documents | College Tutor (2), Notes & Documents (4), Exam Centre (5) |
| **ORBIT** | Productivity & Study Cycles | Study Planner (3), Timetable Grid, Spaced Repetition, Pomodoro Timer |
| **FORGE** | Coding & Career Development | Coding Lab (6), Sandbox Execution, Skill Trees (7), AI Mock Interview |
| **KERNEL** | Backend, Database & AI Core | Express API, single-user JSON persistence, local llama.cpp inference |
| **SENTINEL** | Security, Testing & Health | Test Harness (`api.test.ts`), Health Probes, Package Validator |

---

## 📦 Project Modules

1. **Dashboard (ATLAS)**: Real-time GPA tracker, study hours, problem statistics, today's schedule, AI focus recommendations, and subject mastery meters.
2. **College Tutor (NOVA)**: 6 university core subjects (DSA, OS, DBMS, Networks, Math, AI), Unit 1-5 syllabus trees, and interactive Socratic AI tutor (Feynman explanations, code samples, analogies).
3. **Study Planner (ORBIT)**: Weekly class timetable, Kanban task sprint board, SuperMemo SM-2 spaced repetition queue, and Pomodoro focus timer with Web Audio ambient noise synthesizer.
4. **Notes & Documents (NOVA)**: Markdown note manager with Exam Prep, Interview Prep, and custom folders, text/Markdown/JSON imports, one-click AI study summarizer, and AI-generated MCQs.
5. **Exam Centre (NOVA)**: Adaptive quizzes with timer, 3D flip card flashcards, timed mock exam mode, and 2021-2025 university PYQ bank with model solutions.
6. **Coding Lab (FORGE)**: Multi-language IDE that discovers every runtime installed on the configured Piston sandbox, curated problem library (Two Sum, Valid Parentheses, Reverse List), and AI code assistant.
7. **Skill Development (FORGE)**: Visual career roadmaps (Full-Stack AI, ML Specialist), prerequisite skill trees, and interactive AI Technical Mock Interview Simulator with rubric scoring.
8. **AI Assistant (ATLAS/KERNEL)**: Centralized academic and career chatbot with pre-built prompt templates (Resume review, Bug trace, 7-day study plan, Math solver).
9. **Analytics (ATLAS/SENTINEL)**: Weekly study distribution charts, problem difficulty breakdown, 30-day activity streak calendar, and 6+ unlockable gamification badges.
10. **Profile, Settings & Help (ATLAS/KERNEL)**: Student profile customizer, AI provider status and setup guidance, live system diagnostics audit, and comprehensive documentation manual.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v20.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone the repository and enter the directory
cd learnos

# Install the locked client and server dependencies
npm ci
```

### Running Locally
You can run both client and server simultaneously:

```bash
# Start Backend API (Port 5000)
npm run dev:server

# In a second terminal, start Vite Client (Port 5173)
npm run dev:client
```
- Open browser at: **`http://localhost:5173`**
- Backend Health Check: **`http://localhost:5000/api/system/health`**

### Coding language runtimes
Code execution is unavailable unless an isolated execution service is configured. The current backend can use a Piston-compatible endpoint via `PISTON_API_URL`; the application does not execute submitted code in its own Node.js process. This optional integration still depends on a separate service and is not part of the self-contained AI runtime.

### LearnOS local AI engine

The backend runs [llama.cpp](https://github.com/ggml-org/llama.cpp) through the maintained [`node-llama-cpp`](https://github.com/withcatai/node-llama-cpp) Node integration. The default model is **Qwen3-1.7B Q8_0 GGUF** from [Qwen/Qwen3-1.7B-GGUF](https://huggingface.co/Qwen/Qwen3-1.7B-GGUF), licensed under **Apache-2.0**. Its model file is about **1.83 GB**. This compact model can answer common study questions, but it is not equivalent to a large hosted model and can make mistakes.

The runtime package and platform binary are installed with the LearnOS server dependencies. Download the model once from the LearnOS project root:

```bash
npm ci
npm run setup:model
```

The setup process verifies the file size and SHA-256 checksum and stores the weights under `~/.learnos/models/` (outside the Git repository). After setup, inference runs locally and can work offline. No Ollama installation, account, or API key is required. Set `LEARNOS_MODEL_PATH` to use another absolute model path, or `LEARNOS_GPU=disabled` to force CPU-only inference (`auto` is the default GPU selection).

**Hardware:** 8 GB system RAM minimum; 16 GB recommended. Allow at least 2 GB of disk space for the weights and additional free memory for the OS, model context, and application. CPU inference is supported; throughput depends on the CPU. The server serializes generation to bound memory use. For a self-hosted web deployment, install the model on the backend host; browser-only hosting such as GitHub Pages cannot run the API or model.

For development, copy `server/.env.example` to `server/.env` and set `AUTH_SECRET` to a generated random value of at least 32 bytes (for example, `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`). The server refuses to start with a missing or example secret. The optional GitHub Pages frontend at `docs/` still requires a separately deployed Express backend for server-backed features; it does not include model weights.

### Building for Production
```bash
# Type check and build both client & server
npm run build
```

### Running Test Suite
```bash
# Execute KERNEL & SENTINEL automated test harness
npm test
```

---

## 🔒 Security & Privacy
- No AI provider API keys are used; prompts are processed by the configured local model on the LearnOS backend host.
- Private account-data API routes require a signed session; the anonymous shared demo-token route has been removed.
- Current storage remains a single-user JSON database, not production-grade multi-user persistence. Do not expose this version as a multi-user service until database ownership isolation and migrations are implemented.
- Code execution requires a separately configured isolated execution service. LearnOS does not execute submitted code in its Express process.
