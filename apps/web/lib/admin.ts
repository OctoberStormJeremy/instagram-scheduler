export async function runReconciliation() {
  const res = await fetch('/api/admin/reconcile-scheduled-posts', {
    method: 'POST',
    credentials: 'include'
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error ?? 'Reconciliation failed');
  }

  return body as {
    count: number;
    results: Array<{ postId: string; jobId: string | null }>;
  };
}
