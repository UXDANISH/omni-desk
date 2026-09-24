'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { useToast } from './Toast';

/** Button that calls an API route, shows the server's message as a toast and refreshes server data. */
export function ActionButton({
  url, method = 'POST', body, children, className = 'cf-btn', disabled, title, doneLabel,
}: {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  doneLabel?: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  async function run(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const r = await api<{ message?: string }>(url, method, body);
    if (!r.ok) return toast(r.error);
    if (r.data.message) toast(r.data.message);
    setDone(true);
    start(() => router.refresh());
  }

  return (
    <button type="button" className={className} onClick={run} disabled={disabled || pending || (done && !!doneLabel)} title={title}>
      {done && doneLabel ? doneLabel : children}
    </button>
  );
}
