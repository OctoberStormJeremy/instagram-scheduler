'use client';

import { useState } from 'react';
import { requestJson } from '../../lib/api';

export default function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null);

  async function connect() {
    setMessage('Connecting Instagram...');
    try {
      const data = await requestJson<{ url?: string }>('/api/integrations/instagram/connect');
      if (data.url) {
        window.location.assign(data.url);
      } else {
        setMessage('Missing OAuth URL.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to connect Instagram');
    }
  }

  async function disconnect() {
    setMessage('Disconnecting Instagram...');
    try {
      await requestJson('/api/integrations/instagram/disconnect', { method: 'DELETE' });
      setMessage('Instagram disconnected.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to disconnect Instagram');
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Settings</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" onClick={connect}>Connect Instagram</button>
        <button type="button" onClick={disconnect}>Disconnect</button>
      </div>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
