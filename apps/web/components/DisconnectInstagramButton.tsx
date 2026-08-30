'use client';

import { useState } from 'react';

export function DisconnectInstagramButton() {
  const [loading, setLoading] = useState(false);

  async function disconnect() {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/instagram/disconnect', {
        method: 'DELETE',
        credentials: 'include'
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) throw new Error(body?.error ?? 'Failed to disconnect Instagram');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to disconnect Instagram');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={disconnect} disabled={loading}>
      {loading ? 'Disconnecting...' : 'Disconnect'}
    </button>
  );
}
