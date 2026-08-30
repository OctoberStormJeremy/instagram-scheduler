/**
 * Instagram Basic Display API / Graph API OAuth helpers.
 *
 * Required env vars:
 *   INSTAGRAM_APP_ID        — Facebook App ID
 *   INSTAGRAM_APP_SECRET    — Facebook App Secret
 *   INSTAGRAM_REDIRECT_URI  — Must match the URI registered in the Facebook app
 *                             e.g. https://yourapp.com/api/integrations/instagram/callback
 */

const INSTAGRAM_AUTH_BASE = 'https://api.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_LONG_LIVED_URL = 'https://graph.instagram.com/access_token';
const INSTAGRAM_GRAPH_BASE = 'https://graph.instagram.com';

const SCOPES = ['instagram_basic', 'instagram_content_publish'];

export function getInstagramConfig() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error(
      'Missing required env vars: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI'
    );
  }

  return { appId, appSecret, redirectUri };
}

/**
 * Build the Instagram OAuth authorization URL.
 * `state` should be a random CSRF token stored in the user session.
 */
export function buildAuthUrl(state: string): string {
  const { appId, redirectUri } = getInstagramConfig();

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(','),
    response_type: 'code',
    state
  });

  return `${INSTAGRAM_AUTH_BASE}?${params.toString()}`;
}

export interface ShortLivedTokenResponse {
  access_token: string;
  user_id: string;
}

/**
 * Exchange the OAuth authorization code for a short-lived access token.
 */
export async function exchangeCodeForToken(code: string): Promise<ShortLivedTokenResponse> {
  const { appId, appSecret, redirectUri } = getInstagramConfig();

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code
  });

  const res = await fetch(INSTAGRAM_TOKEN_URL, {
    method: 'POST',
    body
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error_message ?? `Token exchange failed: ${res.status}`);
  }

  return data as ShortLivedTokenResponse;
}

export interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Exchange a short-lived token for a long-lived token (~60 days).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<LongLivedTokenResponse> {
  const { appSecret } = getInstagramConfig();

  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: appSecret,
    access_token: shortLivedToken
  });

  const res = await fetch(`${INSTAGRAM_LONG_LIVED_URL}?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Long-lived token exchange failed: ${res.status}`);
  }

  return data as LongLivedTokenResponse;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
}

/**
 * Fetch the basic profile (id + username) for the token holder.
 */
export async function fetchUserProfile(accessToken: string): Promise<InstagramUserProfile> {
  const params = new URLSearchParams({
    fields: 'id,username',
    access_token: accessToken
  });

  const res = await fetch(`${INSTAGRAM_GRAPH_BASE}/me?${params.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message ?? `Profile fetch failed: ${res.status}`);
  }

  return data as InstagramUserProfile;
}
