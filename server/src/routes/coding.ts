import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { codeExecutionService } from '../services/codeExecutionService.js';
import { aiService } from '../services/aiService.js';

const router = Router();

router.get('/problems', (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    problems: db.getCodingProblems(),
    solvedProblemIds: db.getSolvedProblemIds(req.auth?.userId),
    savedCode: db.getSavedCode(req.auth?.userId)
  });
});

router.get('/problems/:slug', (req: AuthRequest, res: Response) => {
  const problem = db.getCodingProblemBySlug(req.params.slug);
  if (!problem) {
    return res.status(404).json({ success: false, error: 'Problem not found' });
  }
  res.json({ success: true, problem });
});

router.get('/runtimes', async (_req: AuthRequest, res: Response) => {
  const runtimes = await codeExecutionService.getAvailableRuntimes();
  res.json({
    success: true,
    runtimes,
    sandboxConfigured: codeExecutionService.isRemoteSandboxConfigured()
  });
});

router.get('/saved', (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    savedCode: db.getSavedCode(req.auth?.userId),
    solvedProblemIds: db.getSolvedProblemIds(req.auth?.userId)
  });
});

router.post('/saved', (req: AuthRequest, res: Response) => {
  const { problemId, language, code, solved } = req.body || {};
  if (typeof problemId !== 'string' || !problemId || typeof language !== 'string' || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'problemId, language, and code are required.'
    });
  }
  const record = db.saveUserCode(problemId, language, code, Boolean(solved), req.auth?.userId);
  const user = db.getUser(req.auth?.userId);
  res.json({
    success: true,
    saved: record,
    user,
    solvedProblemIds: db.getSolvedProblemIds(req.auth?.userId)
  });
});

// Run custom code (support both /run and /execute)
async function handleRunCode(req: AuthRequest, res: Response) {
  const { language, code, stdin, problemId } = req.body || {};
  if (typeof language !== 'string' || !language.trim() || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'Language and code are required.' });
  }
  if (code.length > 50_000) {
    return res.status(400).json({ success: false, error: 'Code exceeds 50 KB limit.' });
  }

  if (typeof problemId === 'string' && problemId) {
    const langKey = language.split('@')[0];
    db.saveUserCode(problemId, langKey, code, false, req.auth?.userId);
  }

  const result = await codeExecutionService.execute(language, code, typeof stdin === 'string' ? stdin : '');
  return res.json({ success: true, result });
}

router.post('/run', handleRunCode);
router.post('/execute', handleRunCode);

// Evaluate problem against test cases (support both /evaluate and /problems/:slug/evaluate)
async function handleEvaluateProblem(req: AuthRequest, res: Response) {
  const slug = req.params.slug || req.body?.slug;
  const { language, code } = req.body || {};
  if (typeof slug !== 'string' || typeof language !== 'string' || typeof code !== 'string') {
    return res.status(400).json({ success: false, error: 'slug, language, and code are required.' });
  }
  if (code.length > 50_000) {
    return res.status(400).json({ success: false, error: 'Code exceeds 50 KB limit.' });
  }

  try {
    const evaluation = await codeExecutionService.evaluateProblem(slug, language, code);
    const langKey = language.split('@')[0];
    db.saveUserCode(slug, langKey, code, evaluation.allPassed, req.auth?.userId);
    return res.json({
      success: true,
      evaluation,
      user: db.getUser(req.auth?.userId),
      solvedProblemIds: db.getSolvedProblemIds(req.auth?.userId)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Evaluation failed';
    return res.status(404).json({ success: false, error: message });
  }
}

router.post('/evaluate', handleEvaluateProblem);
router.post('/problems/:slug/evaluate', handleEvaluateProblem);

// AI Coding Assistant (Hint, Bug Review, Complexity Analysis)
router.post('/ai-assist', async (req: AuthRequest, res: Response) => {
  const { slug, problemContext, code, action, mode, language = 'javascript' } = req.body || {};
  const resolvedAction = (action || mode || 'hint') as string;
  const problem = db.getCodingProblemBySlug(slug || problemContext);
  const title = problem?.title || problemContext || slug || 'Coding Problem';

  const prompts: Record<string, string> = {
    hint: `Give a concise algorithmic hint for "${title}" without spoiling the full solution. Current ${language} code:\n${code}`,
    debug: `Inspect this ${language} code for "${title}" and identify any bugs, syntax errors, or failing edge cases:\n${code}`,
    review: `Review this ${language} solution for "${title}". Point out potential bugs, edge-case failures, and readability improvements:\n${code}`,
    optimize: `Analyze the exact Big-O time and auxiliary space complexity of this ${language} code for "${title}" and suggest optimizations:\n${code}`,
    complexity: `Analyze the exact Big-O time and auxiliary space complexity of this ${language} code for "${title}":\n${code}`
  };

  try {
    aiService.enforceRateLimit(req.auth?.userId || 'anonymous');
    const feedback = await aiService.generateResponse(prompts[resolvedAction] || prompts.hint, {
      user: db.getUser(req.auth?.userId),
      subject: problem?.category || 'Algorithms',
      topic: title,
      mode: 'code'
    });
    return res.json({ success: true, feedback, response: feedback, fallback: false });
  } catch {
    const fallbackHints: Record<string, string> = {
      hint: `### Algorithmic Hint for ${title}\n- **Category**: ${problem?.category || 'Data Structures & Algorithms'}\n- **Approach**: Consider how an auxiliary lookup structure (Hash Map / Stack / Two Pointers / DP table) eliminates redundant scans.\n- **Constraints**: ${problem?.constraints?.join(', ') || 'Check empty, single-element, and duplicate inputs.'}`,
      debug: `### Debug & Edge-Case Audit for ${title}\n- Verify boundary conditions on input length and negative/duplicate values.\n- Ensure your output format matches \`${problem?.sampleOutput || 'expected output'}\` exactly.\n- Check off-by-one loop bounds and return types.`,
      review: `### Code Review for ${title}\n- Verify boundary conditions on input length and negative/duplicate values.\n- Ensure your output format matches \`${problem?.sampleOutput || 'expected output'}\` exactly.\n- Prefer descriptive variable names and early returns for base cases.`,
      optimize: `### Complexity & Optimization Analysis for ${title}\n- **Target Optimal Time Complexity**: Typically $O(n)$ or $O(n \\log n)$ depending on whether sorting is required.\n- **Auxiliary Space Complexity**: $O(n)$ when using a hash map, stack, or memoization table; $O(1)$ if mutated in place.`,
      complexity: `### Complexity Analysis for ${title}\n- **Target Optimal Time Complexity**: Typically $O(n)$ or $O(n \\log n)$.\n- **Auxiliary Space Complexity**: $O(n)$ with auxiliary lookup structures, or $O(1)$ in-place.`
    };
    const responseText = fallbackHints[resolvedAction] || fallbackHints.hint;
    return res.json({
      success: true,
      feedback: responseText,
      response: responseText,
      fallback: true
    });
  }
});

export default router;
