import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { codeExecutionService } from '../services/codeExecutionService.js';
import { aiService } from '../services/aiService.js';

const router = Router();

router.get('/runtimes', async (_req: Request, res: Response) => {
  try {
    const runtimes = await codeExecutionService.getAvailableRuntimes();
    res.json({ success: true, runtimes });
  } catch (err) {
    res.status(503).json({
      success: false,
      error: err instanceof Error ? err.message : 'Unable to retrieve code runtimes.'
    });
  }
});

// Get list of coding problems
router.get('/problems', (req: Request, res: Response) => {
  const problems = db.getCodingProblems().map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    sampleInput: p.sampleInput,
    sampleOutput: p.sampleOutput
  }));
  res.json({ success: true, problems });
});

// Get full details of a coding problem
router.get('/problems/:slug', (req: Request, res: Response) => {
  const problem = db.getCodingProblemBySlug(req.params.slug);
  if (!problem) return res.status(404).json({ success: false, error: 'Problem not found' });
  res.json({ success: true, problem });
});

// Execute arbitrary code in sandbox
router.post('/execute', async (req: Request, res: Response) => {
  const { language, code, stdin } = req.body;
  if (!language || !code) {
    return res.status(400).json({ success: false, error: 'Language and code are required' });
  }

  try {
    const result = await codeExecutionService.execute(language, code, stdin || '');
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run automated test cases against a problem
router.post('/problems/:slug/evaluate', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { language, code } = req.body;

  if (!language || !code) {
    return res.status(400).json({ success: false, error: 'Language and code are required' });
  }

  try {
    const evaluation = await codeExecutionService.evaluateProblem(slug, language, code);
    if (evaluation.allPassed) {
      const user = db.getUser();
      db.updateUser({ problemsSolved: user.problemsSolved + 1 });
    }
    res.json({ success: true, evaluation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Code Assistant (Explain code, Find bugs, Optimize, Generate Edge Cases)
router.post('/ai-assist', async (req: Request, res: Response) => {
  const { mode, language, code, problemContext } = req.body;
  const allowedModes = ['explain', 'bugs', 'optimize', 'edge_cases'];
  if (
    !allowedModes.includes(mode)
    || typeof language !== 'string'
    || language.length > 50
    || typeof code !== 'string'
    || !code.trim()
    || code.length > 12000
  ) {
    return res.status(400).json({ success: false, error: 'Choose a supported AI mode and provide code between 1 and 12000 characters.' });
  }
  if (problemContext !== undefined && (typeof problemContext !== 'string' || problemContext.length > 2000)) {
    return res.status(400).json({ success: false, error: 'Problem context must be text no longer than 2000 characters.' });
  }

  const context = typeof problemContext === 'string' && problemContext.trim()
    ? `\n\nProblem context and intended behavior:\n${problemContext.trim()}`
    : '';
  let prompt = '';
  if (mode === 'bugs') {
    prompt = `Analyze this ${language} code for logical bugs, boundary errors, or edge case failures. Use the stated problem context to determine intended behavior. If no intent is stated, describe observable behavior and do not guess what the code should do. Provide a minimal fix only when the intended behavior is clear.${context}\n\nCode:\n${code}`;
  } else if (mode === 'optimize') {
    prompt = `Analyze the time and space complexity of this ${language} code and suggest an asymptotic optimization.${context}\n\nCode:\n${code}`;
  } else if (mode === 'edge_cases') {
    prompt = `Generate 5 challenging edge cases (empty input, negatives, large numbers, duplicates) for this problem and show expected outputs.${context}\n\nCode:\n${code}`;
  } else {
    prompt = `Explain this ${language} code line-by-line in a clear, pedagogical style for a computer science student.${context}\n\nCode:\n${code}`;
  }

  try {
    const response = await aiService.generateResponse(prompt, 'Coding Lab');
    res.json({ success: true, response, mode });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
