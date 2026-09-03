'use client';

import { useState, type FormEvent } from 'react';
import { requestJson } from '../../lib/api';

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage('Signing up...');

    try {
      await requestJson('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
          timezone: form.get('timezone')
        })
      });
      setMessage('Signup request sent.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Signup failed');
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Sign up</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <label>Name <input name="name" required /></label>
        <label>Email <input name="email" type="email" required /></label>
        <label>Password <input name="password" type="password" required /></label>
        <label>Timezone <input name="timezone" defaultValue="UTC" required /></label>
        <button type="submit">Sign up</button>
      </form>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
