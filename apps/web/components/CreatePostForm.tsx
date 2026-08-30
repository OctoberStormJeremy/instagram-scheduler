'use client';

import { useState } from 'react';

export function CreatePostForm() {
  const [caption, setCaption] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, scheduledFor, timezone })
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error ?? 'Failed to create post');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section style={{ marginTop: 24 }}>
        <p>✅ Post scheduled! <a href="/dashboard">Back to dashboard</a></p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16, maxWidth: 480 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        Caption
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          maxLength={2200}
          required
          style={{ fontFamily: 'inherit', padding: 8, resize: 'vertical' }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        Scheduled for
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          required
          style={{ padding: 8 }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        Timezone
        <input
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          required
          style={{ padding: 8 }}
        />
      </label>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Scheduling...' : 'Schedule post'}
      </button>
    </form>
  );
}
