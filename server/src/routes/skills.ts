import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';

const router = Router();

router.get('/roadmaps', (req: AuthRequest, res: Response) => {
  res.json({ success: true, roadmaps: db.getRoadmaps(req.auth?.userId) });
});

function handleUpdateSkillNode(req: AuthRequest, res: Response) {
  const { roadmapId, nodeId } = req.params;
  const { status } = req.body || {};
  const validStatuses = ['locked', 'available', 'in_progress', 'mastered'] as const;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid skill node status.' });
  }

  const roadmaps = db.getRoadmaps(req.auth?.userId);
  const roadmap = roadmaps.find((r) => r.id === roadmapId);
  const node = roadmap?.nodes.find((n) => n.id === nodeId);
  if (!roadmap || !node) {
    return res.status(404).json({ success: false, error: 'Roadmap or skill node not found' });
  }

  // Check prerequisites if moving to in_progress or mastered
  if ((status === 'in_progress' || status === 'mastered') && node.prerequisites.length > 0) {
    const masteredIds = new Set(roadmap.nodes.filter((n) => n.status === 'mastered').map((n) => n.id));
    const unmet = node.prerequisites.filter((preId) => !masteredIds.has(preId));
    if (unmet.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Complete all prerequisite skill nodes before starting or mastering this module.'
      });
    }
  }

  const updated = db.updateSkillNodeStatus(roadmapId, nodeId, status, req.auth?.userId);
  return res.json({ success: true, roadmap: updated });
}

router.patch('/roadmaps/:roadmapId/nodes/:nodeId', handleUpdateSkillNode);
router.post('/roadmaps/:roadmapId/nodes/:nodeId/status', handleUpdateSkillNode);

// Start AI Mock Interview
router.post('/interview/start', (req: AuthRequest, res: Response) => {
  const { role = 'Full-Stack AI Engineer', level = 'Intern / New Grad' } = req.body || {};

  const starterQuestions: Record<string, string> = {
    'Full-Stack AI Engineer':
      'Welcome to your technical mock interview! Let’s start with a systems design question: How would you architect a streaming AI tutoring endpoint that handles concurrent student sessions while enforcing per-user rate limits and maintaining conversation context?',
    'Backend Systems Engineer':
      'Welcome! Imagine your PostgreSQL database is experiencing high read latency on a table with 50M rows. Walk me through how you would diagnose the bottleneck, design composite B+ Tree indexes, and introduce a Redis caching layer without serving stale data.',
    'Machine Learning Engineer':
      'Welcome! Explain the bias-variance tradeoff in deep neural networks, and walk through how Scaled Dot-Product Attention in Transformers prevents vanishing gradients compared to recurrent architectures.',
    'Frontend Architect':
      'Welcome! How does React’s Fiber reconciliation algorithm prioritize concurrent user interactions over heavy background rendering, and how would you optimize a dashboard rendering 10,000 live telemetry nodes?'
  };

  const firstQuestion =
    starterQuestions[role] ||
    `Welcome to your ${level} ${role} technical interview! Walk me through a challenging system or algorithm you have designed recently, including its time/space complexity and key architectural tradeoffs.`;

  const session = db.createInterviewSession(role, level, firstQuestion, req.auth?.userId);
  res.status(201).json({ success: true, session });
});

// Submit answer in Mock Interview (support both /answer and /respond)
async function handleInterviewAnswer(req: AuthRequest, res: Response) {
  const session = db.getInterviewSession(req.params.id, req.auth?.userId);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Interview session not found' });
  }

  const { answer } = req.body || {};
  if (typeof answer !== 'string' || !answer.trim()) {
    return res.status(400).json({ success: false, error: 'A non-empty answer is required.' });
  }

  const lastAiQuestion =
    [...session.messages].reverse().find((m) => m.sender === 'ai')?.text || 'Explain your technical approach.';

  session.messages.push({
    sender: 'user',
    text: answer.trim(),
    timestamp: new Date().toISOString()
  });

  try {
    aiService.enforceRateLimit(req.auth?.userId || 'anonymous');
    const evaluation = await aiService.evaluateInterview(lastAiQuestion, answer.trim(), session.role);
    session.messages.push({
      sender: 'ai',
      text: evaluation.followUpQuestion,
      timestamp: new Date().toISOString()
    });
    session.score = evaluation.score;
    session.feedback = evaluation.feedback;
    const saved = db.saveInterviewSession(session, req.auth?.userId);
    return res.json({ success: true, session: saved, evaluation, fallback: false });
  } catch {
    const evaluation = aiService.evaluateInterviewFallback(lastAiQuestion, answer.trim(), session.role);
    session.messages.push({
      sender: 'ai',
      text: evaluation.followUpQuestion,
      timestamp: new Date().toISOString()
    });
    session.score = evaluation.score;
    session.feedback = evaluation.feedback;
    const saved = db.saveInterviewSession(session, req.auth?.userId);
    return res.json({
      success: true,
      session: saved,
      evaluation,
      fallback: true,
      aiNotice: 'Evaluated using LearnOS Structured Engineering Rubric'
    });
  }
}

router.post('/interview/:id/answer', handleInterviewAnswer);
router.post('/interview/:id/respond', handleInterviewAnswer);

export default router;
