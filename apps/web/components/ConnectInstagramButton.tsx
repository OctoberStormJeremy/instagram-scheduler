'use client';

import { useState } from 'react';

export function ConnectInstagramButton() {
  const [loading, setLoading] = useState(false);

  async function connect() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/instagram/connect', {
        credentials: 'include'
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) throw new Error(body?.error ?? 'Failed to start Instagram connection');
      if (!body?.url) throw new Error('Missing OAuth URL');

      window.location.href = body.url;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to connect Instagram');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={connect} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect Instagram'}
    </button>
  );
}
