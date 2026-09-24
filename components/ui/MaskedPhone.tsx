'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Icon } from './Icon';

/**
 * Patient phone numbers are masked by default. Revealing asks the server for the full
 * number (the browser never receives it up front), logs who revealed it, and re-masks after 15s.
 */
export function MaskedPhone({
  last4, kind, id, className, large, onRevealChange,
}: {
  last4: string;
  kind: 'call' | 'patient' | 'member';
  id: string;
  className?: string;
  large?: boolean;
  onRevealChange?: (revealed: boolean) => void;
}) {
  const [phone, setPhone] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (phone) {
      setPhone(null);
      onRevealChange?.(false);
      return;
    }
    const res = await fetch('/api/reveal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id }) });
    if (!res.ok) return;
    const data = (await res.json()) as { phone: string };
    setPhone(data.phone);
    onRevealChange?.(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPhone(null);
      onRevealChange?.(false);
    }, 15000);
  }

  const label = phone ? 'Hide phone number' : 'Reveal phone number (logged)';
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className={clsx('inline-flex items-center gap-1.5 self-start font-mono', large ? 'text-sm text-ink' : 'text-xs text-muted', className)}>
      {phone ?? `***-***-${last4}`}
      <Icon name={phone ? 'eyeOff' : 'eye'} size={large ? 14 : 13} strokeWidth={1.8} />
    </button>
  );
}
