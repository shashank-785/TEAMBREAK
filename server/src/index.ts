import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import tutorRoutes from './routes/tutor.js';
import plannerRoutes from './routes/planner.js';
import notesRoutes from './routes/notes.js';
import examsRoutes from './routes/exams.js';
import codingRoutes from './routes/coding.js';
import skillsRoutes from './routes/skills.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import systemRoutes from './routes/system.js';
import { assertAuthConfiguration, isPublicApiRequest, requireAuth } from './middleware/auth.js';
import { rateLimitWrites, validateJsonPayload } from './middleware/security.js';
import { aiService } from './services/aiService.js';

dotenv.config();
assertAuthConfiguration();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://shashank-785.github.io',
  ...(process.env.CORS_ORIGINS || '').split(',').map(origin => origin.trim()).filter(Boolean)
]);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(validateJsonPayload);
app.use(rateLimitWrites);

app.use('/api', (req, res, next) => {
  if (isPublicApiRequest(req.method, req.path)) return next();
  return requireAuth(req, res, next);
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api') && req.path !== '/api/system/health') {
      console.log(`[API] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/system', systemRoutes);

// Root Health Ping
app.get('/', (req, res) => {
  res.json({
    name: 'LearnOS Backend API Server',
    version: '1.0.0',
    status: 'Running',
    modules: [
      'Dashboard', 'College Tutor', 'Study Planner', 'Notes & Documents',
      'Exam Centre', 'Coding Lab', 'Skill Development', 'AI Assistant',
      'Analytics', 'Profile & Settings'
    ],
    documentation: '/api/system/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Malformed JSON request body' });
  }
  res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                      LEARNOS BACKEND SERVER                   ║
║   AI-Powered Student Learning & Career Development Platform   ║
╚═══════════════════════════════════════════════════════════════╝
  🚀 Server running on: http://localhost:${PORT}
  📡 API Health Check:  http://localhost:${PORT}/api/system/health
  🤖 AI Engine:         Local llama.cpp runtime
  💻 Sandboxed Runner:  ${process.env.PISTON_API_URL ? 'Configured isolated execution service' : 'Unavailable (no isolated execution service configured)'}
  💾 Persistence:       Active
  `);
  void aiService.initialize()
    .catch(error => console.error('[AI] Local model initialization failed:', error))
    .finally(async () => {
      const aiStatus = await aiService.getStatus();
      console.log(`[AI] ${aiStatus.isReady ? `Ready (${aiStatus.model})` : `Unavailable (${aiStatus.error})`}`);
    });
});

async function shutdown(signal: string) {
  console.log(`[Server] ${signal} received; stopping HTTP server and releasing AI resources.`);
  server.close(async error => {
    if (error) {
      console.error('[Server] Failed to close HTTP server cleanly:', error);
      process.exitCode = 1;
    }
    try {
      await aiService.dispose();
    } catch (disposeError) {
      console.error('[AI] Failed to release local model resources:', disposeError);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => { void shutdown('SIGINT'); });
process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
