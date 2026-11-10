# LearnOS Production Deployment Guide

## 1. Architecture Overview

- **Frontend (GitHub Pages)**: `https://shashank-785.github.io/TEAMBREAK/`
  - Built from `client/` via Vite (`base: '/TEAMBREAK/'` in production) and published to `docs/` using `npm run publish:pages`.
  - Uses `HashRouter` so deep links and page refreshes work seamlessly on GitHub Pages.
- **Backend (Render Web Service)**: `https://learnos-backend-ks49.onrender.com/`
  - Express + TypeScript server located in `server/`.
  - Serves all `/api/*` endpoints with CORS configured for `https://shashank-785.github.io` and local development origins.

---

## 2. Backend Deployment on Render (`https://learnos-backend-ks49.onrender.com`)

### Build & Start Commands
- **Root Directory**: `.` (monorepo root) or `server`
  - If deploying from **monorepo root (`.`)**:
    - **Build Command**: `npm ci && npm run build:server`
    - **Start Command**: `npm run start --prefix server`
  - If deploying with **Root Directory = `server`**:
    - **Build Command**: `npm ci && npm run build`
    - **Start Command**: `npm start`

### Required Render Environment Variables
Configure the following in your Render Web Service **Environment** tab:

| Variable | Required | Value / Description |
| :--- | :--- | :--- |
| `PORT` | Yes | `5000` (or managed automatically by Render) |
| `AUTH_SECRET` | **Yes** | 64-character hex string generated via `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` |
| `CORS_ORIGINS` | **Yes** | `https://shashank-785.github.io,http://localhost:5173,http://127.0.0.1:5173` |
| `AI_PROVIDER` | Recommended | `auto` (or `gemini`, `groq`, `openrouter`, `openai`, `fallback`) |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key (`gemini-2.5-flash`) for remote inference on Render Free Tier |
| `GROQ_API_KEY` | Optional | Groq API key (`llama-3.3-70b-versatile`) as primary or alternative cloud inference provider |
| `OPENROUTER_API_KEY` | Optional | OpenRouter API key |
| `PISTON_API_URL` | Optional | `https://emkc.org/api/v2/piston/execute` (or self-hosted Piston v2 endpoint) |
| `LEARNOS_DATA_DIR` | Optional | Mount path if using a Render Persistent Disk (e.g., `/var/data/learnos`) |

> **Important Note on Render Free Tier & AI Models**:
> Render's free instance has 512 MB RAM and must **not** run the 1.83 GB local GGUF model (`npm run setup:model` is only for local desktop/workstation development). On Render, either set `GEMINI_API_KEY` / `GROQ_API_KEY` for cloud AI inference, or leave keys unset to automatically use the built-in **Academic Curriculum Fallback Engine**.

---

## 3. Frontend Deployment on GitHub Pages (`https://shashank-785.github.io/TEAMBREAK/`)

### Production Environment (`client/.env.production`)
`client/.env.production` is pre-configured to point to the Render backend:
```env
VITE_API_URL=https://learnos-backend-ks49.onrender.com
```

### Publishing Updates to GitHub Pages
Run from the repository root:
```bash
npm run publish:pages
```
This script:
1. Compiles `client/` with TypeScript and Vite using `.env.production`.
2. Copies the production bundle from `client/dist/` into `docs/` (including `docs/404.html` SPA fallback).
3. Commit and push `docs/` to the `main` branch. In GitHub Repository **Settings → Pages**, ensure Source is set to **Deploy from a branch: `main` / `/docs`**.

---

## 4. Local Development Setup

```bash
# 1. Install dependencies
npm ci

# 2. Configure server/.env
cp server/.env.example server/.env
# Set AUTH_SECRET in server/.env

# 3. (Optional) Download local Qwen3-1.7B GGUF model for offline local AI
npm run setup:model

# 4. Run server and client
npm run dev:server
npm run dev:client
```
