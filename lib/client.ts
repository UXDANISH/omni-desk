'use client';

/** Small fetch wrapper for client-side mutations against the Node API routes. */
export async function api<T = unknown>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data as { error?: string }).error ?? 'Something went wrong' };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: 'Network error. Check your connection.' };
  }
}
