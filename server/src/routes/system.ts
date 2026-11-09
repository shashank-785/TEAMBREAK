import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { aiService } from '../services/aiService.js';
import { getSupabaseConfig } from '../db/supabaseClient.js';

const router = Router();
const serverStartTime = Date.now();

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
        isReady: aiStatus.isReady,
        modelInstalled: aiStatus.modelInstalled,
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
