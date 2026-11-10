# LearnOS Test Report

## Verified on 2026-11-10

### Builds and dependency audit

- `npm run build`: client production build and server TypeScript build pass.
- `npm test`: 13/13 server checks pass; client TypeScript check passes.
- `npm audit`: zero known vulnerabilities.

### Local AI

- The embedded llama.cpp CPU runtime loads and disposes successfully.
- Qwen3-1.7B Q8_0 GGUF is installed outside the repository and passes the setup script's size and SHA-256 verification.
- Tests exercised real local text generation, streamed conversation context, and interview evaluation. No external AI API or Ollama was used.
- The public setup-status endpoint reports model readiness without exposing server paths or internal error details.

### Authentication and browser checks

- API authorization tests verify that private notes, planner, and profile routes are not public; the AI setup-status endpoint is the only additional public system route.
- An HTTP check confirmed unauthenticated notes requests receive `401`.
- Browser checks completed account signup and onboarding, and confirmed the local-AI setup notice is shown both before signup and during onboarding.
- Desktop and mobile dashboard layouts were visually checked. Progress cards use the account's stored values rather than fabricated sample metrics.
- The API test suite uses an isolated temporary data directory.

### Known runtime limitations

- No Piston endpoint is configured, so isolated multi-language code execution is unavailable in this environment; the test suite verifies that unavailable state.
- The application still uses single-user JSON persistence and is not ready to serve multiple students with private data.
- Browser-driven end-to-end coverage is not yet part of the automated test suite.
