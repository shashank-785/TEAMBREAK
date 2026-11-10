import { Router, Request, Response } from 'express';
import { db, AuthCredentials } from '../db/db.js';
import { createSessionToken, requireAuth, revokeSessionToken, AuthRequest } from '../middleware/auth.js';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const router = Router();

function hashPasswordWithSalt(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, storedHash?: string, storedSalt?: string): boolean {
  if (!storedHash) return false;
  let salt = storedSalt || '';
  let expected = storedHash;
  if (storedHash.includes(':')) {
    const parts = storedHash.split(':');
    salt = parts[0] || '';
    expected = parts[1] || '';
  }
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

router.get('/status', (_req, res) => {
  const account = db.getAuth();
  const user = account ? db.getUser(account.userId) : null;
  res.json({
    success: true,
    registered: Boolean(account),
    onboardingComplete: Boolean(user?.onboardingComplete)
  });
});

router.post('/register', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirmation =
    typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : password;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
  }
  if (password !== confirmation) {
    return res.status(400).json({ success: false, error: 'Passwords do not match.' });
  }

  const existing = db.getAuthByEmail(email);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An account with this email already exists. Please sign in instead.'
    });
  }

  const profileInput = req.body.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
  const nameInput =
    typeof req.body.name === 'string' && req.body.name.trim()
      ? req.body.name.trim()
      : typeof profileInput.name === 'string' && profileInput.name.trim()
        ? profileInput.name.trim()
        : email.split('@')[0];

  const now = new Date().toISOString();
  const userId = `usr_${Date.now()}_${randomBytes(3).toString('hex')}`;
  const { salt, hash } = hashPasswordWithSalt(password);

  const authRecord: AuthCredentials = {
    userId,
    email,
    passwordSalt: salt,
    passwordHash: `${salt}:${hash}`,
    createdAt: now,
    updatedAt: now
  };

  const hasAcademicDetails = Boolean(
    (req.body.university || profileInput.university) &&
    (req.body.major || req.body.branch || profileInput.major || profileInput.branch)
  );

  const user = db.registerAccount(authRecord, {
    ...profileInput,
    name: nameInput,
    email,
    university: req.body.university ?? profileInput.university ?? '',
    degree: req.body.degree ?? profileInput.degree ?? 'B.Tech',
    branch: req.body.branch ?? profileInput.branch ?? profileInput.major ?? 'Computer Science & Engineering',
    major: req.body.major ?? req.body.branch ?? profileInput.major ?? 'Computer Science & Engineering',
    semester: Number(req.body.semester ?? profileInput.semester ?? 5) || 5,
    subjects: Array.isArray(req.body.subjects)
      ? req.body.subjects
      : Array.isArray(profileInput.subjects)
        ? profileInput.subjects
        : undefined,
    learningInterests: Array.isArray(req.body.learningInterests)
      ? req.body.learningInterests
      : Array.isArray(profileInput.learningInterests)
        ? profileInput.learningInterests
        : undefined,
    careerInterests: Array.isArray(req.body.careerInterests)
      ? req.body.careerInterests
      : Array.isArray(profileInput.careerInterests)
        ? profileInput.careerInterests
        : undefined,
    dreamRole: req.body.dreamRole ?? profileInput.dreamRole ?? 'Full-Stack AI Engineer',
    onboardingComplete: Boolean(req.body.onboardingComplete ?? profileInput.onboardingComplete ?? hasAcademicDetails)
  });

  return res.json({
    success: true,
    token: createSessionToken(user.id, email),
    user
  });
});

router.post('/login', (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  const account = db.getAuthByEmail(email);
  if (!account || !verifyPassword(password, account.passwordHash, account.passwordSalt)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const user = db.getUser(account.userId);
  return res.json({
    success: true,
    token: createSessionToken(user.id, account.email),
    user
  });
});

router.post('/logout', requireAuth, (req: AuthRequest, res: Response) => {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    revokeSessionToken(authorization.slice(7).trim());
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: db.getUser(req.auth?.userId) });
});

router.get('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.getUser(req.auth?.userId);
  res.json({ success: true, user });
});

router.put('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Profile updates must be an object' });
  }

  const sanitized: Record<string, unknown> = {};
  const stringFields = [
    'name',
    'university',
    'degree',
    'branch',
    'major',
    'dreamRole',
    'avatarUrl',
    'codingExperience',
    'syllabusCustomText'
  ];
  for (const field of stringFields) {
    if (typeof updates[field] === 'string') {
      sanitized[field] = updates[field].trim();
    }
  }
  if (sanitized.branch && !sanitized.major) {
    sanitized.major = sanitized.branch;
  }
  if (sanitized.major && !sanitized.branch) {
    sanitized.branch = sanitized.major;
  }
  if (updates.semester !== undefined) {
    const sem = Number(updates.semester);
    if (!Number.isNaN(sem) && sem >= 1 && sem <= 12) sanitized.semester = sem;
  }
  if (updates.targetGpa !== undefined) {
    const tg = Number(updates.targetGpa);
    if (!Number.isNaN(tg) && tg >= 0 && tg <= 10) sanitized.targetGpa = tg;
  }
  if (updates.currentGpa !== undefined) {
    const cg = Number(updates.currentGpa);
    if (!Number.isNaN(cg) && cg >= 0 && cg <= 10) sanitized.currentGpa = cg;
  }
  if (Array.isArray(updates.subjects)) {
    sanitized.subjects = updates.subjects.map((s: unknown) => String(s).trim()).filter(Boolean);
  }
  if (Array.isArray(updates.learningInterests)) {
    sanitized.learningInterests = updates.learningInterests.map((s: unknown) => String(s).trim()).filter(Boolean);
  }
  if (Array.isArray(updates.careerInterests)) {
    sanitized.careerInterests = updates.careerInterests.map((s: unknown) => String(s).trim()).filter(Boolean);
  }
  if (updates.preferences && typeof updates.preferences === 'object') {
    sanitized.preferences = updates.preferences;
  }
  sanitized.onboardingComplete = updates.onboardingComplete !== undefined ? Boolean(updates.onboardingComplete) : true;

  const updatedUser = db.updateUser(sanitized, req.auth?.userId);
  res.json({ success: true, user: updatedUser });
});

router.post('/onboarding-skip', requireAuth, (req: AuthRequest, res: Response) => {
  const updatedUser = db.updateUser({ onboardingComplete: true }, req.auth?.userId);
  res.json({ success: true, onboardingComplete: true, user: updatedUser });
});

router.get('/session', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.getUser(req.auth?.userId);
  res.json({
    authenticated: true,
    user,
    provider: 'LearnOS Session Auth'
  });
});

export default router;
