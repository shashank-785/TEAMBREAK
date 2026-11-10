import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { aiService, AIRateLimitError, ChatTurn } from '../services/aiService.js';

const router = Router();

// Get all subjects with units & topics
router.get('/subjects', (req: AuthRequest, res: Response) => {
  const subjects = db.getSubjects(req.auth?.userId);
  res.json({ success: true, subjects });
});

// Get single subject details
router.get('/subjects/:id', (req: AuthRequest, res: Response) => {
  const subject = db.getSubjectById(req.params.id, req.auth?.userId);
  if (!subject) {
    return res.status(404).json({ success: false, error: 'Subject not found' });
  }
  res.json({ success: true, subject });
});

// Toggle topic completion (by subjectId and topicId)
router.post('/subjects/:subjectId/topics/:topicId/toggle', (req: AuthRequest, res: Response) => {
  const { subjectId, topicId } = req.params;
  const topic = db.toggleTopicCompletion(subjectId, topicId, req.auth?.userId);
  if (!topic) {
    return res.status(404).json({ success: false, error: 'Topic not found' });
  }
  res.json({ success: true, topic });
});

// Legacy toggle topic completion route (by topicId alone)
function handleToggleByTopicId(req: AuthRequest, res: Response) {
  const topicId = req.params.id;
  const subjects = db.getSubjects(req.auth?.userId);
  for (const s of subjects) {
    for (const u of s.units) {
      if (u.topics.some((t) => t.id === topicId)) {
        const topic = db.toggleTopicCompletion(s.id, topicId, req.auth?.userId);
        return res.json({ success: true, topic, completed: topic?.isCompleted });
      }
    }
  }
  return res.status(404).json({ success: false, error: 'Topic not found' });
}

router.post('/topics/:id/toggle-completion', handleToggleByTopicId);
router.post('/topics/:id/toggle', handleToggleByTopicId);

// Add custom university syllabus unit/topic
router.post('/subjects/:subjectId/custom-topic', (req: AuthRequest, res: Response) => {
  const { subjectId } = req.params;
  const { unitNumber, unitTitle, title, estimatedMinutes, content, keyPoints, subtopics, learningObjectives } =
    req.body || {};

  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Both topic title and syllabus content are required.'
    });
  }

  const topic = db.addCustomTopic(
    subjectId,
    {
      unitNumber: Number(unitNumber) || 1,
      unitTitle: typeof unitTitle === 'string' ? unitTitle : undefined,
      title,
      estimatedMinutes: Number(estimatedMinutes) || 35,
      content,
      keyPoints: Array.isArray(keyPoints) ? keyPoints.map(String) : undefined,
      subtopics: Array.isArray(subtopics) ? subtopics.map(String) : undefined,
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives.map(String) : undefined
    },
    req.auth?.userId
  );

  if (!topic) {
    return res.status(404).json({ success: false, error: 'Subject not found' });
  }

  return res.status(201).json({
    success: true,
    topic,
    subjects: db.getSubjects(req.auth?.userId)
  });
});

// Context-aware AI Tutor Explanation & Multi-turn Chat
async function handleTutorExplain(req: AuthRequest, res: Response) {
  const userId = req.auth?.userId || 'anonymous';
  const user = db.getUser(req.auth?.userId);
  const {
    topicTitle: bodyTopicTitle,
    subjectName: bodySubjectName,
    mode = 'feynman',
    customQuestion,
    userPrompt,
    history
  } = req.body || {};

  let resolvedTopicTitle = typeof bodyTopicTitle === 'string' ? bodyTopicTitle.trim() : '';
  let resolvedSubjectName = typeof bodySubjectName === 'string' ? bodySubjectName.trim() : '';

  if (req.params.id && !resolvedTopicTitle) {
    for (const s of db.getSubjects(req.auth?.userId)) {
      for (const u of s.units) {
        for (const t of u.topics) {
          if (t.id === req.params.id) {
            resolvedTopicTitle = t.title;
            resolvedSubjectName = s.name;
            break;
          }
        }
      }
    }
  }

  const questionText =
    (typeof customQuestion === 'string' && customQuestion.trim()) ||
    (typeof userPrompt === 'string' && userPrompt.trim()) ||
    '';

  const styleMap: Record<string, string> = {
    feynman: `Explain "${resolvedTopicTitle || 'this topic'}" in ${resolvedSubjectName || 'Computer Science'} using the Feynman technique with a simple mental model, clear breakdown, and a concrete example.`,
    socratic: `Teach "${resolvedTopicTitle || 'this topic'}" in ${resolvedSubjectName || 'Computer Science'} using the Socratic method: provide intuition and ask 2-3 guiding conceptual questions with hints.`,
    code: `Provide a clean, well-commented code implementation and complexity analysis for "${resolvedTopicTitle || 'this topic'}" in ${resolvedSubjectName || 'Computer Science'}.`,
    analogy: `Explain "${resolvedTopicTitle || 'this topic'}" in ${resolvedSubjectName || 'Computer Science'} using a vivid real-world engineering analogy followed by the formal definition.`,
    quiz: `Create a 3-question conceptual check on "${resolvedTopicTitle || 'this topic'}" with brief explanations.`
  };

  let prompt = questionText
    ? `${styleMap[mode] || ''}\n\nStudent Question: ${questionText}`.trim()
    : styleMap[mode] || `Explain "${resolvedTopicTitle || 'this topic'}" clearly for a university CS student.`;

  if (Array.isArray(history) && history.length > 0) {
    const turns = (history as ChatTurn[])
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`)
      .join('\n');
    prompt = `Prior Tutor Conversation:\n${turns}\n\nCurrent Request:\n${prompt}`;
  }

  try {
    aiService.enforceRateLimit(userId);
    const explanation = await aiService.generateResponse(prompt, {
      user,
      subject: resolvedSubjectName || 'Computer Science',
      topic: resolvedTopicTitle,
      mode
    });
    return res.json({
      success: true,
      explanation,
      response: explanation,
      mode,
      fallback: false
    });
  } catch (error) {
    if (error instanceof AIRateLimitError) {
      return res.status(429).json({ success: false, error: error.message });
    }
    const fallbackExplanation = aiService.buildAcademicFallbackResponse(questionText || resolvedTopicTitle || prompt, {
      user,
      subject: resolvedSubjectName || 'Computer Science',
      topic: resolvedTopicTitle,
      mode
    });
    return res.json({
      success: true,
      explanation: fallbackExplanation,
      response: fallbackExplanation,
      mode,
      fallback: true,
      aiNotice:
        'Generated using LearnOS Built-in Curriculum Engine (Live AI provider is currently offline or unconfigured).'
    });
  }
}

router.post('/explain', handleTutorExplain);
router.post('/topics/:id/ai-explain', handleTutorExplain);

export default router;
