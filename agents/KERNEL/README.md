# KERNEL Agent — Backend, Database, Auth & Execution APIs

## Responsibility
**KERNEL** is responsible for the Express server, local JSON persistence, authentication middleware, code-execution integration, and the local academic AI runtime.

## Completed Features
- **Server Framework**: Node.js + Express + TypeScript with ESM modules.
- **Database & Storage**:
  * Persistent single-user JSON storage in `server/data/learnos.json`.
  * PostgreSQL/Supabase schemas and adapters are not the active persistence layer.
- **Local AI Engine**:
  * `node-llama-cpp` embeds llama.cpp in the LearnOS server and loads Qwen3-1.7B Q8_0 GGUF from user-managed storage.
  * Model setup verifies the official model checksum; inference does not call external AI APIs.
  * Model weights must be installed with `npm run setup:model`; no fake response is returned when they are unavailable.
- **Code Execution**:
  * Optional Piston-compatible sandbox endpoint.
  * No in-process untrusted-code fallback; execution is unavailable when no isolated service is configured.
- **REST Endpoints for 10 Modules**:
  * `/api/auth`
  * `/api/tutor`
  * `/api/planner`
  * `/api/notes`
  * `/api/exams`
  * `/api/coding`
  * `/api/skills`
  * `/api/ai`
  * `/api/analytics`
  * `/api/system`

## Source Code Mapping
- `server/src/index.ts`
- `server/src/types/index.ts`
- `server/src/db/db.ts`
- `server/src/db/seed.ts`
- `server/src/db/schema.sql`
- `server/src/db/supabaseClient.ts`
- `server/src/services/aiService.ts`
- `server/src/services/aiConfig.ts`
- `server/scripts/setup-model.ts`
- `server/src/services/codeExecutionService.ts`
- `server/src/routes/*.ts`

## Build & Test Results
- TypeScript Build (`tsc`): Passed with 0 errors.
- Test Suite: 10/10 tests passing.

## Setup Instructions
```bash
npm ci
npm run setup:model
npm run dev:server
```
Server starts on `http://localhost:5000`. Health check: `http://localhost:5000/api/system/health`.
The JSON database is not multi-user production storage; do not expose it to multiple students.
