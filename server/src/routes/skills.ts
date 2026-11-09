import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { aiService } from '../services/aiService.js';
import { MockInterviewSession } from '../types/index.js';

const router = Router();

// Get skill roadmaps
router.get('/roadmaps', (req: Request, res: Response) => {
  res.json({ success: true, roadmaps: db.getRoadmaps() });
});

// Update skill node status (unlock or master)
router.post('/roadmaps/:roadmapId/nodes/:nodeId/status', (req: Request, res: Response) => {
  const { roadmapId, nodeId } = req.params;
  const { status } = req.body; // 'locked' | 'available' | 'in_progress' | 'mastered'
  const ok = db.updateSkillNode(roadmapId, nodeId, status);
  res.json({ success: ok });
});

// Start a new mock interview session
router.post('/interview/start', async (req: Request, res: Response) => {
  const { role, level } = req.body; // e.g. role: 'Frontend Engineer', level: 'Junior/Intern'
  const targetRole = role || 'Full-Stack Software Engineer';
  const targetLevel = level || 'Undergraduate Internship';

  const initialQuestions: Record<string, string> = {
    'Frontend Engineer': "Welcome to your technical interview for Frontend Engineer! Let's start with state and rendering: Can you explain how the React Virtual DOM diffing algorithm works, and why using array indices as `key` props can cause rendering bugs?",
    'Backend Engineer': "Welcome! Let's begin with database design: When would you choose an optimistic locking strategy versus a pessimistic locking strategy in a high-concurrency payment system?",
    'AI Engineer': "Welcome! Let's start with deep learning fundamentals: Can you explain the vanishing gradient problem, why it occurs in deep networks with sigmoid activations, and how modern architectures mitigate it?",
    'Full-Stack AI Engineer': "Welcome! Suppose you are designing an AI coding assistant like LearnOS. How would you architect the backend to securely execute untrusted user code while maintaining sub-second API latency?"
  };

  const firstQuestion = initialQuestions[targetRole] || initialQuestions['Full-Stack AI Engineer'];

  const session: MockInterviewSession = {
    id: 'int_' + Date.now().toString(36),
    role: targetRole,
    level: targetLevel,
    messages: [
      {
        sender: 'ai',
        text: firstQuestion,
        timestamp: new Date().toISOString()
      }
    ]
  };

  db.saveInterview(session);
  res.json({ success: true, session });
});

// Submit an interview response and receive AI feedback / next question
router.post('/interview/:id/respond', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { answer } = req.body;

  const interviews = db.getInterviews();
  const session = interviews.find(i => i.id === id);
  if (!session) return res.status(404).json({ success: false, error: 'Interview session not found' });

  if (typeof answer !== 'string' || !answer.trim() || answer.length > 8000) {
    return res.status(400).json({ success: false, error: 'Answer must contain 1-8000 characters.' });
  }

  try {
    const lastAiQuestion = session.messages.filter(m => m.sender === 'ai').slice(-1)[0]?.text || 'Technical question';
    const evaluation = await aiService.evaluateInterview(lastAiQuestion, answer.trim(), session.role);
    session.messages.push({
      sender: 'user',
      text: answer.trim(),
      timestamp: new Date().toISOString()
    });
    session.score = evaluation.score;
    session.feedback = evaluation;

    const aiFeedbackText = `### Interviewer feedback: ${evaluation.score}/100\n\n**Assessment:** ${evaluation.summary}\n\n**Strengths:**\n${evaluation.strengths.map(item => `- ${item}`).join('\n')}\n\n**Areas for improvement:**\n${evaluation.improvements.map(item => `- ${item}`).join('\n')}\n\n---\n**Follow-up question:**\n${evaluation.followUpQuestion}`;
    session.messages.push({
      sender: 'ai',
      text: aiFeedbackText,
      timestamp: new Date().toISOString()
    });

    db.saveInterview(session);
    res.json({ success: true, session, evaluation });
  } catch (error) {
    res.status(502).json({
      success: false,
      error: error instanceof Error ? error.message : 'The AI interview evaluation failed.'
    });
  }
});

export default router;
