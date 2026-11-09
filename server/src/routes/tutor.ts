import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { aiService } from '../services/aiService.js';

const router = Router();

// Get all subjects with units & topics
router.get('/subjects', (req: Request, res: Response) => {
  const subjects = db.getSubjects();
  res.json({ success: true, subjects });
});

// Get single subject details
router.get('/subjects/:id', (req: Request, res: Response) => {
  const subject = db.getSubjectById(req.params.id);
  if (!subject) {
    return res.status(404).json({ success: false, error: 'Subject not found' });
  }
  res.json({ success: true, subject });
});

// Toggle topic completion
router.post('/topics/:id/toggle-completion', (req: Request, res: Response) => {
  const completed = db.toggleTopicCompletion(req.params.id);
  res.json({ success: true, completed });
});

// AI Learning Support: Explain topic in various pedagogical styles
router.post('/topics/:id/ai-explain', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mode, userPrompt } = req.body; // mode: 'feynman' | 'code' | 'quiz' | 'analogy' | 'custom'

  let topicTitle = 'this Computer Science topic';
  for (const s of db.getSubjects()) {
    for (const u of s.units) {
      for (const t of u.topics) {
        if (t.id === id) {
          topicTitle = `${t.title} in ${s.name}`;
          break;
        }
      }
    }
  }

  let prompt = '';
  if (mode === 'feynman') {
    prompt = `Explain ${topicTitle} using the Feynman Technique and an everyday analogy that a first-year student can instantly grasp.`;
  } else if (mode === 'code') {
    prompt = `Provide a clean, production-ready code implementation of ${topicTitle} with comments explaining time and space complexity.`;
  } else if (mode === 'quiz') {
    prompt = `Generate a 3-question Socratic conceptual quiz on ${topicTitle} to test my deep understanding.`;
  } else if (mode === 'analogy') {
    prompt = `Give an intuitive real-world analogy to understand the core problem solved by ${topicTitle}.`;
  } else {
    prompt = userPrompt || `Explain the key concepts and exam points for ${topicTitle}.`;
  }
  if (mode !== 'custom' && typeof userPrompt === 'string' && userPrompt.trim()) {
    prompt += `\n\nUniversity syllabus and student context:\n${userPrompt.slice(0, 10000)}`;
  }

  try {
    const aiResponse = await aiService.generateResponse(prompt, `College Tutor: ${topicTitle}`);
    res.json({ success: true, response: aiResponse, mode });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
