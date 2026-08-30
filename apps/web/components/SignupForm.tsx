'use client';

import { useState } from 'react';

export function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.error ?? 'Signup failed');
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          style={{ padding: 8 }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ padding: 8 }}
        />
      </label>

      <label style={{ display: 'grid', gap: 4 }}>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          style={{ padding: 8 }}
        />
      </label>

      {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}

      <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <p style={{ margin: 0, fontSize: 14 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </form>
  );
}
