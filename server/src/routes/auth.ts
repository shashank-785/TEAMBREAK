import { Router, Request, Response } from 'express';
import { db } from '../db/db.js';
import { createSessionToken, requireAuth, AuthRequest } from '../middleware/auth.js';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const router = Router();

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, encoded?: string): boolean => {
  if (!encoded) return false;
  const [salt, expected] = encoded.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
};

router.get('/status', (_req, res) => {
  const account = db.getAuth();
  res.json({
    success: true,
    registered: !!account,
    onboardingComplete: !!account?.onboardingComplete
  });
});

router.post('/register', (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirmation = typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: 'A valid email is required' });
  }
  if (password.length < 8) return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
  if (password !== confirmation) return res.status(400).json({ success: false, error: 'Passwords do not match' });
  if (db.getAuth()) return res.status(409).json({ success: false, error: 'An account already exists' });

  const profile = req.body.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
  const user = db.updateUser({ ...profile, id: db.getUser().id, email });
  db.setAuth({ email, passwordHash: hashPassword(password), onboardingComplete: false });
  return res.json({ success: true, token: createSessionToken(user.id, email), user });
});

// Get current user profile
router.post('/login', (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const account = db.getAuth();
  if (!account || account.email !== email || !verifyPassword(password, account.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const user = db.getUser();
  return res.json({
    success: true,
    token: createSessionToken(user.id, email),
    user
  });

});

router.get('/me', requireAuth, (_req: AuthRequest, res: Response) => {
  res.json({ success: true, user: db.getUser() });
});

router.get('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.getUser();
  res.json({ success: true, user });
});

// Update user profile
router.put('/profile', requireAuth, (req: Request, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Profile updates must be an object' });
  }
  const updatedUser = db.updateUser(updates);
  const account = db.getAuth();
  if (account) db.setAuth({ ...account, onboardingComplete: true });
  res.json({ success: true, user: updatedUser });
});

// Simulated Auth Session Check
router.get('/session', requireAuth, (req: Request, res: Response) => {
  const user = db.getUser();
  res.json({
    authenticated: true,
    user,
    provider: 'LearnOS Local Session / Supabase Auth Ready'
  });
});

export default router;
