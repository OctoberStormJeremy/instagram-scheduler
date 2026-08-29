'use client';

import { useState } from 'react';
import { refreshPostStatus } from '../lib/posts';

export function PostStatusRefresh({ postId }: { postId: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRefresh() {
    setLoading(true);

    try {
      const data = await refreshPostStatus(postId);
      setStatus(data.status);
      setPublishedAt(data.publishedAt);
      setLastError(data.lastError);
      setUpdatedAt(data.updatedAt);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Failed to refresh');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Status</h2>
      <button type="button" onClick={onRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh status'}
      </button>

      {status ? <p><strong>Current status:</strong> {status}</p> : null}
      {publishedAt ? <p><strong>Published at:</strong> {new Date(publishedAt).toLocaleString()}</p> : null}
      {updatedAt ? <p><strong>Updated at:</strong> {new Date(updatedAt).toLocaleString()}</p> : null}
      {lastError ? <p style={{ color: 'crimson' }}><strong>Error:</strong> {lastError}</p> : null}
    </section>
  );
}
