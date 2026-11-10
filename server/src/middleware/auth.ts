import { createHmac, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
  auth?: { email: string; userId: string };
}

export function isPublicApiRequest(method: string, path: string): boolean {
  if (method === 'OPTIONS') return true;
  if (method === 'GET' && path === '/auth/status') return true;
  if (method === 'GET' && path === '/system/ai-status') return true;
  return method === 'POST' && (path === '/auth/login' || path === '/auth/register');
}

const exampleSecret = 'replace-with-a-long-random-secret-before-deployment';
const getSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret.trim(), 'utf8') < 32 || secret.trim() === exampleSecret) {
    throw new Error('AUTH_SECRET must be set to a unique random value of at least 32 bytes.');
  }
  return secret;
};

export function assertAuthConfiguration(): void {
  getSecret();
}

export function createSessionToken(userId: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({
    userId,
    email,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  })).toString('base64url');
  const signature = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const [payload, signature] = authorization.slice(7).split('.');
  if (!payload || !signature) {
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }

  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId: string;
      email: string;
      expiresAt: number;
    };
    if (!session.userId || !session.email || session.expiresAt < Date.now()) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }
    req.auth = { userId: session.userId, email: session.email };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
}
