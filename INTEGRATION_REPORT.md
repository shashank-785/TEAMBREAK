# LearnOS Integration Report

## Architecture

LearnOS is an npm monorepo with a React/Vite client and Express server.

- Root package: workspace orchestration
- Client package: React 18, TypeScript, Vite 5, Tailwind CSS 3
- Server package: Express, TypeScript, single-user JSON persistence, local llama.cpp inference through `node-llama-cpp`

## Current module routing

- `/` Dashboard
- `/tutor` College Tutor
- `/planner` Study Planner
- `/notes` Notes & Documents
- `/exams` Exam Centre
- `/coding` Coding Lab
- `/skills` Skill Development
- `/assistant` AI Assistant
- `/analytics` Analytics
- `/settings` Profile and Settings

## Integration conventions

1. Add module-owned UI under `client/src/pages/<ModuleName>/`.
2. Reuse only global shell components under `client/src/components/`.
3. Add shared domain contracts under `client/src/types/`.
4. Add API calls to `client/src/services/api.ts` or a module service that it exposes.
5. Keep server routes under `server/src/routes/`.
6. Add persistent domain records to the JSON database schema and seed data in coordinated changes.
7. Register exactly one route in `App.tsx`.
8. Update sidebar navigation in one place only.

## Current architecture limits

- The database is a single shared JSON file; it is not multi-user storage and does not provide per-user ownership isolation.
- The AI runtime is local to the backend host. Model weights are installed once outside the repository with `npm run setup:model`; no external AI inference API is used.
- Document context currently uses keyword matching against note text, not vector embeddings or a document-ingestion pipeline.
- Code execution requires a configured isolated sandbox service; it is unavailable by default.

## Module integration checklist

For each module:

- Confirm one owner and one route.
- Confirm all API calls have typed request and response contracts.
- Confirm loading, empty, error and success states.
- Confirm buttons perform real actions.
- Confirm data persists after refresh.
- Confirm responsive desktop/tablet/mobile behavior.
- Confirm server input validation.
- Confirm unauthorized actions are rejected after authentication is enabled.
- Confirm test coverage for happy and error paths.
- Confirm no duplicate layout, sidebar, or global modal.
