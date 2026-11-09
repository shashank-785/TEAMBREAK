import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { aiService, AiChatMessage } from '../services/aiService.js';

const router = Router();
const maxMessageLength = 8000;

function getUserId(req: Request) {
  return (req as AuthRequest).auth?.userId;
}

function validMessage(message: unknown): message is string {
  return typeof message === 'string' && message.trim().length > 0 && message.length <= maxMessageLength;
}

router.get('/status', async (_req: Request, res: Response) => {
  res.json({ success: true, status: await aiService.getStatus() });
});

router.get('/conversations', requireAuth, (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
  res.json({ success: true, conversations: db.getAiConversations(userId) });
});

router.post('/conversations', (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
  const title = typeof req.body?.title === 'string' ? req.body.title : 'New chat';
  const conversation = db.createAiConversation(userId, title);
  res.status(201).json({ success: true, conversation });
});

router.get('/conversations/:id', requireAuth, (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
  const conversation = db.getAiConversation(userId, req.params.id);
  if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
  res.json({ success: true, conversation });
});

router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
  const { message } = req.body || {};
  if (!validMessage(message)) {
    return res.status(400).json({ success: false, error: `Message must contain 1-${maxMessageLength} characters.` });
  }

  const conversation = db.getAiConversation(userId, req.params.id);
  if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
  const status = await aiService.getStatus();
  if (!status.isReady) return res.status(503).json({ success: false, error: status.error });

  const prompt = message.trim();
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const retryingLastTurn = lastMessage?.role === 'user' && lastMessage.text === prompt;
  const modelMessages: AiChatMessage[] = [
    ...conversation.messages.slice(-20).map(item => ({ role: item.role, content: item.text })),
    ...(!retryingLastTurn ? [{ role: 'user' as const, content: prompt }] : [])
  ];
  if (!retryingLastTurn) {
    db.addAiConversationMessage(userId, conversation.id, {
      id: 'msg_' + randomUUID(),
      role: 'user',
      text: prompt,
      timestamp: new Date().toISOString()
    });
  }
  const controller = new AbortController();
  let answer = '';

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    answer = await aiService.streamResponse(modelMessages, userId, token => {
      res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
    }, controller.signal);

    const assistantMessage = {
      id: 'msg_' + randomUUID(),
      role: 'assistant' as const,
      text: answer,
      timestamp: new Date().toISOString()
    };
    db.addAiConversationMessage(userId, conversation.id, assistantMessage);
    res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
    res.end();
  } catch (error) {
    if (answer.trim()) {
      db.addAiConversationMessage(userId, conversation.id, {
        id: 'msg_' + randomUUID(),
        role: 'assistant',
        text: answer,
        timestamp: new Date().toISOString()
      });
    }
    if (!controller.signal.aborted && !res.destroyed) {
      const errorMessage = error instanceof Error ? error.message : 'The AI request failed.';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

router.get('/history', requireAuth, (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });
  const [conversation] = db.getAiConversations(userId);
  const fullConversation = conversation ? db.getAiConversation(userId, conversation.id) : null;
  res.json({ success: true, history: fullConversation?.messages || [] });
});

router.post('/chat', async (req: Request, res: Response) => {
  const { message, category } = req.body || {};
  if (!validMessage(message)) {
    return res.status(400).json({ success: false, error: `Message must contain 1-${maxMessageLength} characters.` });
  }

  try {
    const status = await aiService.getStatus();
    if (!status.isReady) return res.status(503).json({ success: false, error: status.error });

    const userId = getUserId(req);
    const aiResponseText = await aiService.generateResponse(
      message.trim(),
      typeof category === 'string' ? category.slice(0, 100) : undefined,
      userId
    );
    const aiMsg = {
      id: 'msg_ai_' + randomUUID(),
      role: 'assistant' as const,
      text: aiResponseText,
      timestamp: new Date().toISOString()
    };
    res.json({ success: true, message: aiMsg, provider: status.provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The AI request failed.';
    res.status(502).json({ success: false, error: message });
  }
});

export default router;
