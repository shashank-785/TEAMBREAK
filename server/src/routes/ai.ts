import { randomUUID } from 'crypto';
import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { aiService, AIRateLimitError, ChatTurn } from '../services/aiService.js';

const router = Router();
const MAX_MESSAGE_LENGTH = 8000;

function normalizeMessages(rawMessages: unknown): ChatTurn[] {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const role = record.role === 'assistant' ? 'assistant' : record.role === 'user' ? 'user' : null;
      const content =
        typeof record.content === 'string'
          ? record.content.trim()
          : typeof record.text === 'string'
            ? record.text.trim()
            : '';
      if (!role || !content) return null;
      return { role, content: content.slice(0, MAX_MESSAGE_LENGTH) } as ChatTurn;
    })
    .filter((item): item is ChatTurn => Boolean(item));
}

router.get('/status', async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, status: await aiService.getStatus() });
});

router.get('/conversations', (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'default';
  res.json({ success: true, conversations: db.getAiConversations(userId) });
});

router.post('/conversations', (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'default';
  const title = typeof req.body?.title === 'string' ? req.body.title : 'New chat';
  const conversation = db.createAiConversation(userId, title);
  res.status(201).json({ success: true, conversation });
});

router.get('/conversations/:id', (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'default';
  const conversation = db.getAiConversation(userId, req.params.id);
  if (!conversation) return res.status(404).json({ success: false, error: 'Conversation not found' });
  return res.json({ success: true, conversation });
});

router.post('/conversations/:id/messages', async (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'default';
  const user = db.getUser(req.auth?.userId);
  const { message } = req.body || {};
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return res
      .status(400)
      .json({ success: false, error: `Message must contain 1-${MAX_MESSAGE_LENGTH} characters.` });
  }

  let conversation = db.getAiConversation(userId, req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  try {
    aiService.enforceRateLimit(userId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Rate limit exceeded.';
    return res.status(429).json({ success: false, error: msg });
  }

  const prompt = message.trim();
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const retryingLastTurn = lastMessage?.role === 'user' && lastMessage.text === prompt;
  const modelMessages: ChatTurn[] = [
    ...conversation.messages.slice(-20).map((item) => ({ role: item.role, content: item.text })),
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
  res.flushHeaders?.();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    answer = await aiService.streamResponse(
      modelMessages,
      req.auth?.userId,
      (token) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
        }
      },
      controller.signal
    );

    const assistantMessage = {
      id: 'msg_' + randomUUID(),
      role: 'assistant' as const,
      text: answer,
      timestamp: new Date().toISOString()
    };
    db.addAiConversationMessage(userId, conversation.id, assistantMessage);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage })}\n\n`);
      res.end();
    }
  } catch {
    if (controller.signal.aborted || res.writableEnded) return;
    const fallbackText = aiService.buildAcademicFallbackResponse(prompt, {
      user,
      history: modelMessages
    });
    const chunks = fallbackText.match(/.{1,24}(\s|$)|\S+/g) || [fallbackText];
    for (const chunk of chunks) {
      if (res.writableEnded) break;
      res.write(`data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`);
    }
    const assistantMessage = {
      id: 'msg_' + randomUUID(),
      role: 'assistant' as const,
      text: fallbackText,
      timestamp: new Date().toISOString()
    };
    db.addAiConversationMessage(userId, conversation.id, assistantMessage);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMessage, fallback: true })}\n\n`);
      res.end();
    }
  }
});

router.get('/history', (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'default';
  const [conversation] = db.getAiConversations(userId);
  const fullConversation = conversation ? db.getAiConversation(userId, conversation.id) : null;
  res.json({ success: true, history: fullConversation?.messages || [] });
});

// Non-streaming AI chat endpoint
router.post('/chat', async (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'anonymous';
  const user = db.getUser(req.auth?.userId);
  const { prompt, message, subject, topic, mode, history } = req.body || {};

  const inputPrompt =
    typeof prompt === 'string' && prompt.trim()
      ? prompt.trim()
      : typeof message === 'string' && message.trim()
        ? message.trim()
        : '';

  if (!inputPrompt) {
    return res.status(400).json({ success: false, error: 'A prompt or message is required.' });
  }
  if (inputPrompt.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`
    });
  }

  try {
    aiService.enforceRateLimit(userId);
    const status = await aiService.getStatus();
    const responseText = await aiService.generateResponse(inputPrompt, {
      user,
      subject: typeof subject === 'string' ? subject : undefined,
      topic: typeof topic === 'string' ? topic : undefined,
      mode: typeof mode === 'string' ? mode : undefined
    });

    return res.json({
      success: true,
      response: responseText,
      message: {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        text: responseText,
        timestamp: new Date().toISOString()
      },
      provider: status.provider,
      fallback: false
    });
  } catch (error) {
    if (error instanceof AIRateLimitError) {
      return res.status(429).json({ success: false, error: error.message });
    }
    const fallbackText = aiService.buildAcademicFallbackResponse(inputPrompt, {
      user,
      subject: typeof subject === 'string' ? subject : undefined,
      topic: typeof topic === 'string' ? topic : undefined,
      mode: typeof mode === 'string' ? mode : undefined,
      history: normalizeMessages(history)
    });
    return res.json({
      success: true,
      response: fallbackText,
      message: {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        timestamp: new Date().toISOString()
      },
      provider: 'LearnOS Academic Curriculum Engine (Fallback)',
      fallback: true,
      aiNotice:
        'Live remote/local AI model is currently unconfigured; responded using the LearnOS Built-in Academic Knowledge Engine.'
    });
  }
});

// Streaming SSE AI chat endpoint (used by AIAssistantDrawer)
router.post('/chat/stream', async (req: AuthRequest, res: Response) => {
  const userId = req.auth?.userId || 'anonymous';
  const user = db.getUser(req.auth?.userId);
  const messages = normalizeMessages(req.body?.messages);
  const lastTurn = messages.at(-1);

  if (!lastTurn || lastTurn.role !== 'user') {
    return res.status(400).json({
      success: false,
      error: 'A conversation array ending with a user message is required.'
    });
  }

  try {
    aiService.enforceRateLimit(userId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Rate limit exceeded.';
    return res.status(429).json({ success: false, error: msg });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const controller = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controller.abort();
  });

  try {
    const responseText = await aiService.streamResponse(
      messages,
      req.auth?.userId,
      (token) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
        }
      },
      controller.signal
    );

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', response: responseText, fallback: false })}\n\n`);
      res.end();
    }
  } catch {
    if (controller.signal.aborted || res.writableEnded) return;
    // Stream structured academic fallback so the student assistant remains functional
    const fallbackText = aiService.buildAcademicFallbackResponse(lastTurn.content, {
      user,
      history: messages
    });
    const chunks = fallbackText.match(/.{1,24}(\s|$)|\S+/g) || [fallbackText];
    for (const chunk of chunks) {
      if (res.writableEnded) break;
      res.write(`data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`);
    }
    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          response: fallbackText,
          fallback: true,
          aiNotice: 'Responded via LearnOS Academic Fallback Engine'
        })}\n\n`
      );
      res.end();
    }
  }
});

export default router;
