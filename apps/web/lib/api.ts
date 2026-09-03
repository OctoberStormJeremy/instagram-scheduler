export async function requestJson<T = Record<string, unknown>>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? 'Request failed');
  }

  return body as T;
}
