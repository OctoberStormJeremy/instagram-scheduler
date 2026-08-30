import { Router } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const SALT_ROUNDS = 12;
const SESSION_TTL_DAYS = 30;

function sessionExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d;
}

authRouter.post('/signup', async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, password: hashed, name: name ?? null }
  });

  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt: sessionExpiresAt() }
  });

  res
    .setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_DAYS * 86400}`)
    .json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        isAdmin: user.isAdmin
      }
    });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const passwordMatches =
    user != null && (await bcrypt.compare(password, user.password));

  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: { token, userId: user.id, expiresAt: sessionExpiresAt() }
  });

  res
    .setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_DAYS * 86400}`)
    .json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        timezone: user.timezone,
        isAdmin: user.isAdmin
      }
    });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const cookieToken = req.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('session='))
    ?.slice('session='.length) ?? null;

  const token = bearerToken ?? cookieToken;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  res
    .setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0')
    .json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      timezone: user.timezone,
      isAdmin: user.isAdmin
    }
  });
});

