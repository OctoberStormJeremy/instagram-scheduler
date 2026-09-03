'use client';

import { useState } from 'react';
import { reconcileScheduledPosts } from '../../lib/admin';

export default function AdminPage() {
  const [message, setMessage] = useState<string | null>(null);

  async function onRun() {
    setMessage('Running reconciliation...');
    try {
      const data = await reconcileScheduledPosts();
      setMessage(`Reconciliation complete: ${data.count ?? 0} post(s) queued.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reconciliation failed');
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Admin</h1>
      <p>Reconciliation tools for missed scheduled posts.</p>
      <button type="button" onClick={onRun}>Run reconciliation</button>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
