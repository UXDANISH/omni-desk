'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { NAV_MAIN, NAV_SYS } from '@/lib/nav';

/** Phone navigation: Overview and Calls are designed for owners checking between patients. */
export function MobileTabBar({ needsCount }: { needsCount: number }) {
  const path = usePathname();
  const params = useSearchParams();
  const [more, setMore] = useState(false);
  const needsActive = path === '/calls' && params.get('outcome') === 'needs';
  const tabs: { href?: string; label: string; icon: IconName; active: boolean; badge?: number }[] = [
    { href: '/overview', label: 'Overview', icon: 'overview', active: path === '/overview' && !more },
    { href: '/calls', label: 'Calls', icon: 'calls', active: path.startsWith('/calls') && !needsActive && !more },
    { href: '/calls?outcome=needs', label: 'Needs human', icon: 'alert', active: needsActive && !more, badge: needsCount },
    { label: 'More', icon: 'more', active: more },
  ];
  const moreLinks = [...NAV_MAIN.slice(2), ...NAV_SYS, { href: '/profile', label: 'Your profile', icon: 'patients' as IconName }];

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid h-[68px] grid-cols-4 border-t bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {tabs.map((t) => {
          const cls = clsx('relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium no-underline', t.active ? 'text-accent-tx hover:text-accent-tx' : 'text-muted hover:text-ink');
          const inner = (
            <>
              <Icon name={t.icon} size={22} />
              {t.label}
              {!!t.badge && <span className="absolute left-[calc(50%+6px)] top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-warn-bg px-1 font-mono text-[10px] text-warn">{t.badge}</span>}
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className={cls} aria-current={t.active ? 'page' : undefined} onClick={() => setMore(false)}>{inner}</Link>
          ) : (
            <button key={t.label} type="button" className={cls} aria-expanded={more} onClick={() => setMore((m) => !m)}>{inner}</button>
          );
        })}
      </nav>
      {more && (
        <>
          <div className="fixed inset-0 z-[29] bg-[var(--scrim)] md:hidden" onClick={() => setMore(false)} />
          <div role="dialog" aria-label="More" className="fixed inset-x-0 bottom-[68px] z-[29] flex flex-col gap-1 rounded-t-2xl bg-surface px-4 pb-4 pt-3 shadow-pop md:hidden">
            <span className="mb-2 h-1 w-9 self-center rounded bg-line" />
            {moreLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMore(false)} className="flex h-12 items-center gap-3.5 px-2 text-[15px] text-ink no-underline hover:text-ink">
                <Icon name={l.icon} size={20} />{l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
