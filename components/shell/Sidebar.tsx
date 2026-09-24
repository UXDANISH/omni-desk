'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV_MAIN, NAV_SYS, type NavItem } from '@/lib/nav';
import { Icon } from '@/components/ui/Icon';
import { Logo, Wordmark } from '@/components/ui/Logo';
import { useSession } from './SessionProvider';

function Item({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={clsx('flex h-10 items-center gap-3 rounded-lg px-3 no-underline', active ? 'bg-accent-bg font-semibold text-accent-tx hover:text-accent-tx' : 'text-ink hover:bg-surface2 hover:text-ink')}
    >
      <Icon name={item.icon} />
      <span className="flex-1">{item.label}</span>
      {!!badge && <span className="grid h-5 min-w-[22px] place-items-center rounded-full bg-warn-bg px-1.5 font-mono text-[11px] font-medium text-warn" aria-label={`${badge} need a human`}>{badge}</span>}
    </Link>
  );
}

export function Sidebar({ needsCount }: { needsCount: number }) {
  const path = usePathname();
  const { practice } = useSession();
  const isActive = (href: string) => path === href || path.startsWith(href + '/');
  return (
    <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col gap-5 border-r bg-surface px-3.5 py-5 md:flex">
      <div className="flex items-center gap-2.5 px-1.5">
        <Logo />
        <Wordmark />
      </div>
      <div className="flex w-full items-center gap-2.5 rounded-lg border bg-ground px-3 py-2.5 text-left">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">Smile Dental</span>
          <span className="font-mono text-[11px] uppercase text-muted">{practice}</span>
        </span>
        <Link href="/login?step=practice" aria-label="Switch practice" className="text-muted hover:text-ink"><Icon name="updown" size={14} strokeWidth={2} /></Link>
      </div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV_MAIN.map((i) => <Item key={i.href} item={i} active={isActive(i.href)} badge={i.href === '/calls' ? needsCount : undefined} />)}
      </nav>
      <div className="mx-2 h-px bg-line" />
      <nav aria-label="Configuration" className="flex flex-col gap-0.5">
        {NAV_SYS.map((i) => <Item key={i.href} item={i} active={isActive(i.href)} />)}
      </nav>
    </aside>
  );
}
