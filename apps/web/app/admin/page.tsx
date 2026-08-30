'use client';

import { useEffect, useState } from 'react';
import { runReconciliation } from '../../lib/admin';

type ReconciliationRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  foundCount: number;
  enqueuedCount: number;
  errorCount: number;
  notes: string | null;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; results: Array<{ postId: string; jobId: string | null }> } | null>(null);
  const [runs, setRuns] = useState<ReconciliationRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadRuns() {
    try {
      const res = await fetch('/api/admin/reconciliation/runs', {
        credentials: 'include'
      });
      const body = await res.json();
      setRuns(body.runs ?? []);
    } catch {
      setRuns([]);
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

  async function onRun() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await runReconciliation();
      setResult(data);
      await loadRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconciliation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Admin</h1>
      <p>Reconciliation tools for missed scheduled posts.</p>

      <button type="button" onClick={onRun} disabled={loading}>
        {loading ? 'Reconciling...' : 'Run reconciliation'}
      </button>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {result ? (
        <section style={{ marginTop: 24 }}>
          <h2>Latest run result</h2>
          <p>Re-enqueued {result.count} post(s).</p>
        </section>
      ) : null}

      <section style={{ marginTop: 32 }}>
        <h2>Recent runs</h2>
        {runs.length === 0 ? (
          <p>No reconciliation runs yet.</p>
        ) : (
          <ul style={{ display: 'grid', gap: 12, paddingLeft: 18 }}>
            {runs.map((run) => (
              <li key={run.id}>
                <div><strong>{run.status}</strong> — {new Date(run.startedAt).toLocaleString()}</div>
                <div>Found: {run.foundCount}, Enqueued: {run.enqueuedCount}, Errors: {run.errorCount}</div>
                {run.finishedAt ? <div>Finished: {new Date(run.finishedAt).toLocaleString()}</div> : null}
                {run.notes ? <div style={{ color: 'crimson' }}>{run.notes}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
