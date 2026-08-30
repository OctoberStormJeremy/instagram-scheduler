import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
  isAdmin: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Reads the session token from the `Authorization: ****** header
 * or the `session` cookie, validates it against the DB, and attaches `req.user`.
 * Returns 401 if no valid session is found.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await lookupSession(token);

  if (!user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  req.user = user;
  next();
}

/**
 * Same as requireAuth but only blocks if a token is present and invalid.
 * If no token is provided the request continues with req.user undefined.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (token) {
    const user = await lookupSession(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookie = req.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('session='));

  if (cookie) {
    return cookie.slice('session='.length);
  }

  return null;
}

async function lookupSession(token: string): Promise<AuthenticatedUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  const { user } = session;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
    isAdmin: user.isAdmin
  };
}

