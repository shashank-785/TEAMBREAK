# LearnOS Integration Report

## 1. Architecture Overview

LearnOS is a full-stack TypeScript monorepo with a React 18 + Vite frontend (`client/`) and an Express + TypeScript backend (`server/`).

- **Root Package**: Workspace scripts (`dev`, `build`, `test`, `publish:pages`, `setup:model`)
- **Client Package (`client/`)**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, `HashRouter` for GitHub Pages compatibility
- **Server Package (`server/`)**: Express, TypeScript, multi-user JSON persistence (`server/src/db/db.ts`), centralized multi-provider AI service (`server/src/services/ai.ts`)

---

## 2. Module Routing & API Map

| Frontend Route | UI Component | Backend API Prefix | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| `/` | `Dashboard.tsx` | `/api/analytics`, `/api/planner`, `/api/tutor` | Real study stats, subject mastery, today's timetable, upcoming tasks, recent activity |
| `/tutor` | `CollegeTutor.tsx` | `/api/tutor` | 6 CS subjects, unit/topic syllabus tree, custom university topics, multi-turn AI tutor |
| `/planner` | `StudyPlanner.tsx` | `/api/planner` | Kanban task CRUD & edit modal, weekly timetable add/delete, SM-2 revisions, Pomodoro timer |
| `/notes` | `Notes.tsx` | `/api/notes` | Folder organization, Markdown editor, `.txt`/`.md`/`.json` upload, AI summary & MCQ/flashcard generator |
| `/exams` | `ExamCentre.tsx` | `/api/exams` | Subject quizzes, persistent score history, timed mock exams, custom flashcards, 2021–2025 PYQs |
| `/coding` | `CodingLab.tsx` | `/api/coding` | Multi-language editor, custom stdin, Piston sandbox + JS Worker fallback, saved code persistence, AI hints |
| `/skills` | `SkillDevelopment.tsx` | `/api/skills` | Career roadmaps, server-enforced prerequisite locks, interactive AI mock interviews |
| `/assistant` | `AIAssistant.tsx` | `/api/ai` | Multi-conversation SSE streaming chat, note/task context toggles, academic fallback resilience |
| `/analytics` | `Analytics.tsx` | `/api/analytics` | Real 7-day study hours, 30-day activity heatmap, subject mastery, quiz accuracy, achievements |
| `/settings` | `ProfileSettings.tsx` | `/api/auth`, `/api/system` | Academic profile editor, AI provider status, authenticated system diagnostics |

---

## 3. Resolved Frontend-Backend Integration Mismatches

All 13 route and payload mismatches between `client/src/services/api.ts` and `server/src/routes/*.ts` have been resolved:

1. **Production Backend URL**: Updated `client/.env.production` from `https://learnos-api.onrender.com` to `https://learnos-backend-ks49.onrender.com`.
2. **Public vs. Protected System Health**: Public health check (`GET /api/system/health`) returns lightweight status; internal diagnostics moved to `GET /api/system/diagnostics` behind `requireAuth`.
3. **Onboarding Skip**: Added `POST /api/auth/onboarding-skip` and wired optional onboarding so new students can explore immediately or complete their academic profile at any time.
4. **College Tutor Topic Completion**: Aligned `PATCH /api/tutor/topics/:id/complete` and `POST /api/tutor/topics/:id/toggle` with `subjectId` and `completed` state return.
5. **College Tutor Custom University Topics**: Added `POST /api/tutor/subjects/:subjectId/custom-topic` and frontend modal.
6. **College Tutor Multi-Turn AI Chat**: Added `POST /api/tutor/ask` and `POST /api/tutor/explain` supporting conversation history, subtopics, and Socratic/Feynman/Code/Analogy modes.
7. **Study Planner Timetable CRUD**: Added `POST /api/planner/schedule` (and `/schedules` alias) + `DELETE /api/planner/schedule/:id` (and `/schedules/:id` alias).
8. **Notes AI Question & Flashcard Generation**: Enhanced `POST /api/notes/:id/generate-questions` to return structured MCQs and optionally save generated flashcards directly to the student's Exam Centre deck.
9. **Exam Centre Score History & Custom Flashcards**: Added `GET /api/exams/history` and `POST /api/exams/flashcards`.
10. **Coding Lab Saved Code Persistence & Custom Stdin**: Added `GET /api/coding/saved`, `POST /api/coding/saved`, and `stdin` forwarding in `POST /api/coding/execute`.
11. **Skill Development Prerequisite Validation**: Enforced prerequisite node completion checks in `POST /api/skills/roadmaps/:roadmapId/nodes/:nodeId/status`.
12. **Analytics Real Data Contract**: Aligned `GET /api/analytics/summary` to return real `quizStats`, `subjectMasteries`, `progress`, and `activityLog` with zero `Math.random()` fabrication.
13. **Multi-User Isolation**: Upgraded `server/src/db/db.ts` to isolate every registered student account in `accounts[userId]` while keeping `server/data/learnos.json` untouched.
