import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { aiService } from '../services/aiService.js';

const router = Router();

router.get('/', (req: AuthRequest, res: Response) => {
  const { subject, search } = req.query;
  let notes = db.getNotes(req.auth?.userId);

  if (subject && typeof subject === 'string' && subject !== 'All') {
    notes = notes.filter((n) => n.subject.toLowerCase() === subject.toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.subject.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  res.json({ success: true, notes });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { title, subject, folder, content, tags } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Note title is required.' });
  }
  const newNote = db.createNote(
    {
      title: title.trim(),
      subject: typeof subject === 'string' && subject.trim() ? subject.trim() : 'General Computer Science',
      folder: typeof folder === 'string' && folder.trim() ? folder.trim() : 'Lecture Notes',
      content: typeof content === 'string' ? content : '',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : ['Notes']
    },
    req.auth?.userId
  );
  res.status(201).json({ success: true, note: newNote });
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const updated = db.updateNote(req.params.id, req.body || {}, req.auth?.userId);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }
  res.json({ success: true, note: updated });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const deleted = db.deleteNote(req.params.id, req.auth?.userId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }
  res.json({ success: true });
});

// AI Summarize Note (with structured fallback when live AI is offline)
router.post('/:id/summarize', async (req: AuthRequest, res: Response) => {
  const notes = db.getNotes(req.auth?.userId);
  const note = notes.find((n) => n.id === req.params.id);
  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }

  try {
    const { summary, keyConcepts } = await aiService.summarizeNotes(note.content);
    const updated = db.updateNote(note.id, { summary, keyConcepts }, req.auth?.userId);
    return res.json({ success: true, note: updated, summary, keyConcepts, fallback: false });
  } catch {
    const { summary, keyConcepts } = aiService.summarizeNotesFallback(note.content);
    const updated = db.updateNote(note.id, { summary, keyConcepts }, req.auth?.userId);
    return res.json({
      success: true,
      note: updated,
      summary,
      keyConcepts,
      fallback: true,
      aiNotice: 'Summarized using LearnOS Structured Text Analyzer'
    });
  }
});

// AI Generate Flashcards & Quiz from Note (with structured fallback)
async function handleGenerateNoteMaterials(req: AuthRequest, res: Response) {
  const notes = db.getNotes(req.auth?.userId);
  const note = notes.find((n) => n.id === req.params.id);
  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }

  const formatQuestionsMarkdown = (
    quiz: { question: string; options: string[]; correctOption: number; explanation: string }[]
  ) =>
    quiz
      .map(
        (q, i) =>
          `### Q${i + 1}. ${q.question}\n${q.options.map((opt, idx) => `- ${String.fromCharCode(65 + idx)}) ${opt}`).join('\n')}\n\n**Answer:** ${String.fromCharCode(65 + q.correctOption)} — ${q.explanation}`
      )
      .join('\n\n');

  try {
    const { flashcards, quiz } = await aiService.generateFlashcardsFromNote(note.title, note.subject, note.content);
    const createdCards = flashcards.map((fc) => db.createFlashcard(fc, req.auth?.userId));
    return res.json({
      success: true,
      flashcards: createdCards,
      quiz,
      questions: formatQuestionsMarkdown(quiz),
      fallback: false
    });
  } catch {
    const { flashcards, quiz } = aiService.generateFlashcardsFallback(note.title, note.subject, note.content);
    const createdCards = flashcards.map((fc) => db.createFlashcard(fc, req.auth?.userId));
    return res.json({
      success: true,
      flashcards: createdCards,
      quiz,
      questions: formatQuestionsMarkdown(quiz),
      fallback: true,
      aiNotice: 'Generated study flashcards & quiz using LearnOS Curriculum Extractor'
    });
  }
}

router.post('/:id/generate-materials', handleGenerateNoteMaterials);
router.post('/:id/generate-questions', handleGenerateNoteMaterials);

export default router;
