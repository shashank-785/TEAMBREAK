import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { aiService } from '../services/aiService.js';
import { getSupabaseConfig } from '../db/supabaseClient.js';

const router = Router();
const serverStartTime = Date.now();

router.get('/ai-status', async (_req: Request, res: Response) => {
  const status = await aiService.getStatus();
  const message = status.isReady
    ? 'LearnOS local AI is ready. You do not need to install anything on your device.'
    : status.state === 'not_installed'
      ? 'LearnOS AI is not set up on this server yet. This is a one-time setup for the server team; students do not need to download an AI app or model.'
      : status.state === 'loading'
        ? 'LearnOS AI is warming up on the server. You can create your account while it finishes.'
        : status.minimumRamAvailable
          ? 'LearnOS AI is temporarily unavailable on this server. The server team may need to check its local model setup.'
          : 'This server does not currently meet LearnOS AI hardware requirements. Please contact the LearnOS administrator.';

  res.json({
    success: true,
    isReady: status.isReady,
    state: status.state,
    model: status.model,
    setupRequired: status.state === 'not_installed',
    message
  });
});

router.get('/health', async (req: Request, res: Response) => {
  const supabase = getSupabaseConfig();
  const aiStatus = await aiService.getStatus();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
    services: {
      api: { status: 'online', port: 5000 },
      database: {
        status: 'online',
        type: 'Persistent Transactional Storage',
        itemCounts: {
          subjects: db.getSubjects().length,
          tasks: db.getTasks().length,
          notes: db.getNotes().length,
          codingProblems: db.getCodingProblems().length
        }
      },
      supabase: {
        status: supabase.isConfigured ? 'connected' : 'ready (local mode active)',
        config: supabase
      },
      aiEngine: {
        status: aiStatus.isReady ? 'connected' : 'unavailable',
        provider: aiStatus.provider,
        runtime: aiStatus.runtime,
        model: aiStatus.model,
        modelInstalled: aiStatus.modelInstalled,
        state: aiStatus.state,
        isReady: aiStatus.isReady,
        error: aiStatus.error
      },
      codeSandbox: {
        status: process.env.PISTON_API_URL ? 'configured' : 'not-configured',
        supportedLanguages: ['javascript', 'python', 'c', 'cpp'],
        engines: ['External Piston Sandbox or configured PISTON_API_URL']
      }
    }
  });
});

export default router;
