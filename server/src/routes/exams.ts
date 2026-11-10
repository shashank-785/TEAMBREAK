import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/quizzes', (req: AuthRequest, res: Response) => {
  const { subject } = req.query;
  let quizzes = db.getQuizzes();
  if (subject && typeof subject === 'string' && subject !== 'All') {
    quizzes = quizzes.filter((q) => q.subject.toLowerCase().includes(subject.toLowerCase()));
  }
  res.json({ success: true, quizzes });
});

router.get('/history', (req: AuthRequest, res: Response) => {
  res.json({ success: true, history: db.getQuizHistory(req.auth?.userId) });
});

function handleQuizSubmit(req: AuthRequest, res: Response) {
  const { answers, subject = 'All Subjects', durationSeconds, examTitle } = req.body || {};
  const allQuizzes = db.getQuizzes();
  const quizzes =
    subject && subject !== 'All' && subject !== 'All Subjects'
      ? allQuizzes.filter((q) => q.subject.toLowerCase().includes(String(subject).toLowerCase()))
      : allQuizzes;

  let correct = 0;
  const weakSubjects = new Set<string>();
  const results = quizzes.map((q) => {
    const userChoice = answers ? answers[q.id] : undefined;
    const isCorrect = userChoice === q.correctOption;
    if (isCorrect) {
      correct++;
    } else {
      weakSubjects.add(q.subject);
    }
    return {
      questionId: q.id,
      subject: q.subject,
      question: q.question,
      isCorrect,
      userChoice,
      correctOption: q.correctOption,
      explanation: q.explanation
    };
  });

  const totalQuestions = quizzes.length || 1;
  const accuracy = Math.round((correct / totalQuestions) * 100);

  const { attempt, user } = db.recordQuizAttempt(
    {
      subject: String(subject),
      score: correct,
      totalQuestions: quizzes.length,
      accuracy,
      durationSeconds: Number(durationSeconds) || undefined,
      examTitle: typeof examTitle === 'string' ? examTitle : undefined
    },
    req.auth?.userId
  );

  const revisionRecommendations = Array.from(weakSubjects).map((subName) => ({
    subject: subName,
    recommendation: `Review core definitions, flashcards, and practice problems in ${subName} via College Tutor.`
  }));

  res.json({
    success: true,
    score: correct,
    total: quizzes.length,
    accuracy,
    scorePercentage: accuracy,
    results,
    attempt,
    revisionRecommendations,
    user,
    history: db.getQuizHistory(req.auth?.userId)
  });
}

router.post('/quizzes/submit', handleQuizSubmit);
router.post('/submit', handleQuizSubmit);

router.get('/flashcards', (req: AuthRequest, res: Response) => {
  const { subject } = req.query;
  let flashcards = db.getFlashcards(req.auth?.userId);
  if (subject && typeof subject === 'string' && subject !== 'All') {
    flashcards = flashcards.filter((fc) => fc.subject.toLowerCase().includes(subject.toLowerCase()));
  }
  res.json({ success: true, flashcards });
});

router.post('/flashcards', (req: AuthRequest, res: Response) => {
  const { subject, front, back } = req.body || {};
  if (typeof front !== 'string' || !front.trim() || typeof back !== 'string' || !back.trim()) {
    return res.status(400).json({ success: false, error: 'Flashcard front and back text are required.' });
  }
  const card = db.createFlashcard(
    {
      subject: typeof subject === 'string' && subject.trim() ? subject.trim() : 'Computer Science',
      front: front.trim(),
      back: back.trim()
    },
    req.auth?.userId
  );
  res.status(201).json({ success: true, flashcard: card });
});

function handleToggleFlashcard(req: AuthRequest, res: Response) {
  const card = db.toggleFlashcardMastery(req.params.id, req.auth?.userId);
  if (!card) {
    return res.status(404).json({ success: false, error: 'Flashcard not found' });
  }
  return res.json({ success: true, flashcard: card });
}

router.post('/flashcards/:id/master', handleToggleFlashcard);
router.post('/flashcards/:id/toggle', handleToggleFlashcard);
router.post('/flashcards/:id/toggle-mastery', handleToggleFlashcard);

router.get('/mock-exams', (_req: AuthRequest, res: Response) => {
  res.json({ success: true, mockExams: db.getMockExams() });
});

router.get('/pyqs', (req: AuthRequest, res: Response) => {
  const { subject } = req.query;
  let pyqs = db.getPYQs();
  if (subject && typeof subject === 'string' && subject !== 'All') {
    pyqs = pyqs.filter((p) => p.subject.toLowerCase().includes(subject.toLowerCase()));
  }
  res.json({ success: true, pyqs });
});

export default router;
