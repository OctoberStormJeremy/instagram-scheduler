import { Router } from 'express';
import { randomBytes } from 'crypto';
import { prisma } from '../lib/db';
import {
  buildAuthUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchUserProfile
} from '../lib/instagram';

export const instagramRouter = Router();

/**
 * GET /api/integrations/instagram/connect
 * Generates a CSRF state token and returns the Instagram OAuth URL.
 */
instagramRouter.get('/connect', async (req, res) => {
  const state = randomBytes(16).toString('hex');

  // Store state in a short-lived HttpOnly cookie so the callback can verify it.
  res.setHeader(
    'Set-Cookie',
    `ig_oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`
  );

  try {
    const url = buildAuthUrl(state);
    res.json({ url, state });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build auth URL' });
  }
});

/**
 * GET /api/integrations/instagram/callback?code=...&state=...
 * Exchanges the authorization code for tokens and persists the account.
 */
instagramRouter.get('/callback', async (req, res) => {
  const { code, state, error: igError } = req.query as Record<string, string>;

  if (igError) {
    res.status(400).json({ error: `Instagram OAuth error: ${igError}` });
    return;
  }

  if (!code || !state) {
    res.status(400).json({ error: 'Missing code or state' });
    return;
  }

  // Verify CSRF state
  const stateCookie = req.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('ig_oauth_state='))
    ?.slice('ig_oauth_state='.length);

  if (!stateCookie || stateCookie !== state) {
    res.status(400).json({ error: 'Invalid OAuth state' });
    return;
  }

  // Clear the state cookie
  res.setHeader('Set-Cookie', 'ig_oauth_state=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');

  try {
    const shortLived = await exchangeCodeForToken(code);
    const longLived = await exchangeForLongLivedToken(shortLived.access_token);
    const profile = await fetchUserProfile(longLived.access_token);

    const expiresAt = new Date(Date.now() + longLived.expires_in * 1000);

    // Upsert so reconnecting the same account refreshes the token.
    await prisma.instagramAccount.upsert({
      where: { igUserId: profile.id },
      create: {
        igUserId: profile.id,
        igUsername: profile.username,
        accessToken: longLived.access_token,
        tokenExpiry: expiresAt,
        userId: req.user!.id
      },
      update: {
        igUsername: profile.username,
        accessToken: longLived.access_token,
        tokenExpiry: expiresAt,
        userId: req.user!.id
      }
    });

    res.json({ ok: true, username: profile.username });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'OAuth callback failed' });
  }
});

/**
 * GET /api/integrations/instagram/status
 * Returns all connected Instagram accounts for the current user.
 */
instagramRouter.get('/status', async (req, res) => {
  const accounts = await prisma.instagramAccount.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      igUserId: true,
      igUsername: true,
      tokenExpiry: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ accounts });
});

/**
 * DELETE /api/integrations/instagram/disconnect
 * Body: { accountId: string }
 * Removes an Instagram account connection.
 */
instagramRouter.delete('/disconnect', async (req, res) => {
  const { accountId } = req.body ?? {};

  if (!accountId) {
    res.status(400).json({ error: 'accountId is required' });
    return;
  }

  const account = await prisma.instagramAccount.findFirst({
    where: { id: accountId, userId: req.user!.id }
  });

  if (!account) {
    res.status(404).json({ error: 'Instagram account not found' });
    return;
  }

  await prisma.instagramAccount.delete({ where: { id: account.id } });

  res.json({ ok: true });
});

