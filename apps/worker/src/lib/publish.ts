/**
 * Instagram Graph API publish flow:
 *
 * 1. Create a media container  (POST /{ig-user-id}/media)
 * 2. Poll until container status is FINISHED
 * 3. Publish the container     (POST /{ig-user-id}/media_publish)
 *
 * Required env var: S3_PUBLIC_BASE_URL (or equivalent CDN URL) so that media
 * assets uploaded to S3/R2 are reachable by Instagram's servers.
 */

const GRAPH_BASE = 'https://graph.instagram.com/v20.0';

/** Maximum poll attempts before giving up (each attempt is ~3 s apart). */
const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3_000;

export interface PublishResult {
  instagramMediaId: string;
}

/**
 * Create a media container on Instagram.
 * Returns the container ID.
 */
async function createContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const params = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: accessToken
  });

  const res = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: 'POST',
    body: params
  });

  const data = await res.json();

  if (!res.ok || !data.id) {
    throw new Error(
      data?.error?.message ?? `Failed to create media container: ${res.status}`
    );
  }

  return data.id as string;
}

/**
 * Poll the container status until it is FINISHED or we give up.
 */
async function waitForContainer(
  containerId: string,
  accessToken: string
): Promise<void> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const params = new URLSearchParams({
      fields: 'status_code',
      access_token: accessToken
    });

    const res = await fetch(`${GRAPH_BASE}/${containerId}?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message ?? `Container poll failed: ${res.status}`);
    }

    const status: string = data.status_code ?? '';

    if (status === 'FINISHED') return;
    if (status === 'ERROR' || status === 'EXPIRED') {
      throw new Error(`Container entered terminal state: ${status}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Container ${containerId} did not finish within the polling window`);
}

/**
 * Publish a finished container and return the published media ID.
 */
async function publishContainer(
  igUserId: string,
  containerId: string,
  accessToken: string
): Promise<string> {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken
  });

  const res = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    body: params
  });

  const data = await res.json();

  if (!res.ok || !data.id) {
    throw new Error(data?.error?.message ?? `Failed to publish container: ${res.status}`);
  }

  return data.id as string;
}

/**
 * Full publish flow: create container → poll → publish.
 */
export async function publishToInstagram(opts: {
  igUserId: string;
  accessToken: string;
  imageUrl: string;
  caption: string;
}): Promise<PublishResult> {
  const { igUserId, accessToken, imageUrl, caption } = opts;

  const containerId = await createContainer(igUserId, accessToken, imageUrl, caption);
  await waitForContainer(containerId, accessToken);
  const instagramMediaId = await publishContainer(igUserId, containerId, accessToken);

  return { instagramMediaId };
}

/**
 * Build the public URL for an S3 key using S3_PUBLIC_BASE_URL env var.
 * e.g. https://cdn.example.com/uploads/user-id/file.jpg
 */
export function buildPublicMediaUrl(s3Key: string): string {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error('Missing required environment variable: S3_PUBLIC_BASE_URL');
  }
  return `${base.replace(/\/$/, '')}/${s3Key}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
