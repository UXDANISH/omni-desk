import { Logo } from '@/components/ui/Logo';
import { SampleTag } from '@/components/ui/Pill';
import { ThemeToggle } from './ThemeToggle';
import { AccountMenu } from './AccountMenu';

/**
 * Sticky page header: title (Bodoni Moda), optional "Sample data" tag, page controls,
 * the page's single primary action, theme toggle and account menu.
 * Usable from both server and client components.
 */
export function TopBar({ title, sample, controls, action }: { title: string; sample?: boolean; controls?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-ground px-4 md:gap-4 md:px-7">
      <Logo size={32} className="md:hidden" />
      <div className="flex min-w-[120px] flex-1 items-baseline gap-3">
        <h1 className="truncate font-display text-[22px] font-medium tracking-[-0.01em] md:text-[28px]">{title}</h1>
        {sample && <SampleTag />}
      </div>
      {controls && <div className="hidden xl:block">{controls}</div>}
      {action && <div className="hidden md:block">{action}</div>}
      <ThemeToggle />
      <AccountMenu />
    </header>
  );
}

export function PageBody({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <main id="main" className={`flex w-full flex-1 flex-col gap-5 p-4 md:px-7 md:pb-10 md:pt-6 ${narrow ? 'max-w-[980px]' : 'max-w-[1400px]'}`}>
      {children}
    </main>
  );
}
