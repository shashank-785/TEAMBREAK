# LearnOS Deployment Guide

## Local development

From the LearnOS root:

```bash
npm ci
npm run setup:model
npm run dev:server
```

In a second terminal:

```bash
npm run dev:client
```

Open `http://localhost:5173`.

The one-time model setup downloads a verified 1.83 GB Qwen3-1.7B Q8_0 GGUF file into `~/.learnos/models/`, outside the repository. The model is Apache-2.0 licensed. After setup, inference runs locally and can work offline.

## Environment

Copy `server/.env.example` to `server/.env`. Never commit real secrets. Set `AUTH_SECRET` to a unique random value with at least 32 bytes; the server will refuse to start if it is missing, too short, or still set to the example placeholder. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Available settings:

- `PORT`: Express API port
- `CORS_ORIGINS`: comma-separated allowed frontend origins
- `LEARNOS_GPU`: `auto` (default) or `disabled` to force CPU inference
- `LEARNOS_MODEL_PATH`: optional absolute path to the model file
- `PISTON_API_URL`: optional Piston-compatible isolated code execution endpoint
- `AUTH_SECRET`: required random signing secret (at least 32 bytes) for authenticated API sessions

AI inference does not use Ollama or an external AI API. If the model weights or native runtime are missing, the server reports AI as unavailable and does not return generated placeholder responses. Code execution remains unavailable without an isolated sandbox service.

## Self-hosted web deployment

Deploy the Express backend and serve the frontend separately. Run `npm ci` and `npm run setup:model` on the backend host, configure the frontend origin in `CORS_ORIGINS`, and keep `LEARNOS_MODEL_PATH` readable by the server process. The model is not downloaded on each launch. Students access the hosted inference engine through the browser and do not install an AI application. GitHub Pages alone cannot host the API or run the model.

The Q8_0 weights require about 1.83 GB of disk, with 8 GB RAM as the minimum and 16 GB recommended for the host. Generation is serialized to limit memory use, so concurrent requests queue. A small model is not equivalent to a large hosted model.

This repository still uses single-user JSON persistence and is not ready to serve multiple students with private data. Do not expose it as a multi-user production service until per-user database ownership, migrations, backup, and recovery are implemented.

## Production build

```bash
npm run build:client
npm run build:server
```

Deploy the Express API separately and serve the contents of `client/dist` through the frontend host. Configure the frontend host origin in `CORS_ORIGINS`.
