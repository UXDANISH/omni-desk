'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useSession } from './SessionProvider';
import { SwitchUserDialog } from './SwitchUserDialog';
import { SITE } from '@/lib/site';

export function AccountMenu() {
  const { user } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const item = (icon: IconName, label: string, props: { href?: string; onClick?: () => void }) => {
    const cls = 'flex h-10 items-center gap-3 rounded-lg px-2.5 text-left text-ink no-underline hover:bg-surface2 hover:text-ink';
    const inner = <><Icon name={icon} size={17} /><span className="flex-1">{label}</span></>;
    return props.href ? (
      <Link role="menuitem" href={props.href} className={cls} onClick={() => setOpen(false)}>{inner}</Link>
    ) : (
      <button role="menuitem" type="button" className={cls} onClick={props.onClick}>{inner}</button>
    );
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className={`flex items-center gap-2.5 whitespace-nowrap rounded-full border bg-surface py-[3px] pl-[3px] pr-2 hover:border-accent ${open ? 'border-accent' : ''}`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-surface2 text-xs font-semibold">{user.initials}</span>
        <span className="hidden flex-col text-left leading-tight xl:flex">
          <span className="text-[13px] font-medium">{user.name}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{user.role}</span>
        </span>
        <Icon name="chevronDown" size={14} strokeWidth={2} className="text-muted" />
      </button>

      {open && (
        <div role="menu" aria-label="Account" className="cf-card absolute right-0 top-[calc(100%+8px)] z-[46] flex w-[280px] flex-col gap-0.5 p-2 shadow-pop">
          <div className="mb-1 flex items-center gap-3 border-b px-2.5 pb-3 pt-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface2 text-[15px] font-semibold">{user.initials}</span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">{user.name}</span>
              <span className="truncate font-mono text-[11px] text-muted">{user.email}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{user.role}</span>
            </span>
          </div>
          {item('patients', 'Your profile', { href: '/profile' })}
          {item('switch', 'Switch user', { onClick: () => { setOpen(false); setSwitching(true); } })}
          {item('settings', 'Settings', { href: '/settings' })}
          {SITE.demo && item('lock', 'Preview session timeout', { onClick: () => { setOpen(false); window.dispatchEvent(new Event('cf-session-preview')); } })}
          <div className="my-1 h-px bg-line" />
          {item('logout', 'Sign out', { onClick: signOut })}
        </div>
      )}
      <SwitchUserDialog open={switching} onClose={() => setSwitching(false)} />
    </div>
  );
}
