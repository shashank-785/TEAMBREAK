import { Router, Response } from 'express';
import { db } from '../db/db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all tasks
router.get('/tasks', (req: AuthRequest, res: Response) => {
  res.json({ success: true, tasks: db.getTasks(req.auth?.userId) });
});

// Create a new task
router.post('/tasks', (req: AuthRequest, res: Response) => {
  const { title, subjectId, subjectName, dueDate, priority, category } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Task title is required.' });
  }
  const newTask = db.createTask(
    {
      title: title.trim(),
      subjectId,
      subjectName: subjectName || 'General Study',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      priority: priority || 'medium',
      status: 'todo',
      category: category || 'reading'
    },
    req.auth?.userId
  );
  res.status(201).json({ success: true, task: newTask });
});

// Update task (status, title, priority, dueDate, category, subjectName)
function handleUpdateTask(req: AuthRequest, res: Response) {
  const updated = db.updateTask(req.params.id, req.body || {}, req.auth?.userId);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  return res.json({ success: true, task: updated });
}

router.patch('/tasks/:id', handleUpdateTask);
router.put('/tasks/:id', handleUpdateTask);

// Delete task
router.delete('/tasks/:id', (req: AuthRequest, res: Response) => {
  const deleted = db.deleteTask(req.params.id, req.auth?.userId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }
  res.json({ success: true });
});

// Timetable Schedules (support both /schedule and /schedules)
router.get('/schedule', (req: AuthRequest, res: Response) => {
  res.json({ success: true, schedules: db.getSchedules(req.auth?.userId) });
});
router.get('/schedules', (req: AuthRequest, res: Response) => {
  res.json({ success: true, schedules: db.getSchedules(req.auth?.userId) });
});

function handleCreateSchedule(req: AuthRequest, res: Response) {
  const { dayOfWeek, startTime, endTime, title, subject, location, type } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Schedule slot title is required.' });
  }
  const newSchedule = db.createSchedule(
    {
      dayOfWeek: Number(dayOfWeek) || 1,
      startTime: startTime || '09:00',
      endTime: endTime || '10:00',
      title: title.trim(),
      subject: subject || 'Computer Science',
      location: location || 'Study Desk',
      type: type || 'self_study'
    },
    req.auth?.userId
  );
  return res.status(201).json({ success: true, schedule: newSchedule });
}

router.post('/schedule', handleCreateSchedule);
router.post('/schedules', handleCreateSchedule);

function handleDeleteSchedule(req: AuthRequest, res: Response) {
  const deleted = db.deleteSchedule(req.params.id, req.auth?.userId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Schedule item not found' });
  }
  return res.json({ success: true });
}

router.delete('/schedule/:id', handleDeleteSchedule);
router.delete('/schedules/:id', handleDeleteSchedule);

// Spaced Repetition Revisions
router.get('/revisions', (req: AuthRequest, res: Response) => {
  res.json({ success: true, revisions: db.getRevisions(req.auth?.userId) });
});

function handleCompleteRevision(req: AuthRequest, res: Response) {
  const rev = db.completeRevision(req.params.id, req.auth?.userId);
  if (!rev) {
    return res.status(404).json({ success: false, error: 'Revision item not found' });
  }
  return res.json({ success: true, revision: rev });
}

router.post('/revisions/:id/complete', handleCompleteRevision);
router.post('/revisions/:id/advance', handleCompleteRevision);

// Study Sessions & Pomodoro
router.get('/sessions', (req: AuthRequest, res: Response) => {
  res.json({ success: true, sessions: db.getStudySessions(req.auth?.userId) });
});

router.post('/pomodoro/complete', (req: AuthRequest, res: Response) => {
  const minutes = Math.max(1, Math.min(240, Number(req.body?.minutes) || 25));
  const mode = req.body?.mode || 'focus';
  const subject = typeof req.body?.subject === 'string' ? req.body.subject : undefined;
  const { user, session } = db.logStudySession(minutes, mode, subject, req.auth?.userId);
  res.json({ success: true, user, totalStudyHours: user.totalStudyHours, session });
});

export default router;
