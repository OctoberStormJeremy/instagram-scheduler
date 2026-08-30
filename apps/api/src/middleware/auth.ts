import type { Request, Response, NextFunction } from 'express';

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
 * or the `session` cookie, validates it, and attaches `req.user`.
 *
 * Returns 401 if no valid session is found.
 *
 * NOTE: Token validation is a stub — replace with a real DB/cache lookup
 * once the database layer is wired in.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = validateToken(token);

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
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (token) {
    const user = validateToken(token);
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

/**
 * Stub validator — replace with a real Session DB lookup.
 * Returns null for any token that doesn't match the dev sentinel.
 */
function validateToken(token: string): AuthenticatedUser | null {
  // In development, accept any non-empty token and return a demo user.
  // TODO: replace with `prisma.session.findUnique({ where: { token } })`.
  if (process.env.NODE_ENV !== 'production' && token.length > 0) {
    return {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'Demo User',
      timezone: 'UTC',
      isAdmin: true
    };
  }

  return null;
}
