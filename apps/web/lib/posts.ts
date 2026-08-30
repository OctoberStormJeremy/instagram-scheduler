export async function refreshPostStatus(postId: string) {
  const res = await fetch(`/api/posts/${postId}/status`, {
    credentials: 'include'
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error ?? 'Failed to refresh post status');
  }

  return body as {
    status: string;
    publishedAt: string | null;
    lastError: string | null;
    updatedAt: string;
  };
}
