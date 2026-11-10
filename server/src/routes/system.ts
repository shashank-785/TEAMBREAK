import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';
import { codeExecutionService } from '../services/codeExecutionService.js';

const router = Router();

// Public, non-sensitive operational health check (used by Navbar status badge and Render health probes)
router.get('/health', async (_req: Request, res: Response) => {
  const ai = await aiService.getStatus();
  res.json({
    success: true,
    status: 'operational',
    service: 'LearnOS Core Engine',
    timestamp: new Date().toISOString(),
    ai: {
      provider: ai.provider,
      model: ai.model,
      isReady: ai.isReady,
      state: ai.state,
      mode: ai.mode || (ai.isReady ? 'remote' : 'fallback'),
      fallbackAvailable: true
    }
  });
});

// Protected internal diagnostics (requires authentication; never exposes secrets)
router.get('/diagnostics', requireAuth, async (_req: AuthRequest, res: Response) => {
  const mem = process.memoryUsage();
  const ai = await aiService.getStatus();
  const runtimes = await codeExecutionService.getAvailableRuntimes();
  const sandboxConfigured = codeExecutionService.isRemoteSandboxConfigured();

  res.json({
    success: true,
    status: 'operational',
    service: 'LearnOS Core Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
    },
    storage: {
      driver: db.getStorageInfo().driver,
      updatedAt: db.getStorageInfo().updatedAt
    },
    ai,
    codeExecution: {
      engine: sandboxConfigured ? 'Piston Remote Container Sandbox' : 'Browser Worker / Safe Fallback Mode',
      sandboxConfigured,
      runtimesCount: runtimes.length,
      availableRuntimes: runtimes
    }
  });
});

// Public AI readiness endpoint
router.get('/ai-status', async (_req: Request, res: Response) => {
  const ai = await aiService.getStatus();
  res.json({
    success: true,
    isReady: ai.isReady,
    state: ai.state,
    model: ai.model,
    provider: ai.provider,
    mode: ai.mode || (ai.isReady ? 'remote' : 'fallback'),
    setupRequired: false,
    message: ai.isReady
      ? `AI Assistant ready (${ai.provider} • ${ai.model})`
      : 'LearnOS Built-in Curriculum AI Fallback is active. Remote cloud inference can be enabled via backend environment variables.',
    ai
  });
});

export default router;
