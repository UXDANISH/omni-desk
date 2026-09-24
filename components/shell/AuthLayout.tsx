import { Logo, Wordmark } from '@/components/ui/Logo';

/** Two-column layout for the public sign-in, invite and password-reset pages. */
export function AuthLayout({ title, intro, children, before }: { title: string; intro: React.ReactNode; children: React.ReactNode; before?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {before}
      <main id="main" className="flex flex-col justify-center gap-8 px-6 py-12 sm:px-12">
        <div className="flex items-center gap-2.5"><Logo /><Wordmark /></div>
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-medium leading-tight tracking-[-0.01em]">{title}</h1>
            <p className="text-muted">{intro}</p>
          </div>
          {children}
        </div>
      </main>
      <aside aria-hidden="true" className="hidden flex-col justify-end gap-4 bg-chip p-12 text-[#EDF1F3] lg:flex" data-theme="dark">
        <span className="font-mono text-[11px] tracking-[0.12em] text-[#8C97A3]">OMNIDESK</span>
        <p className="max-w-[440px] font-display text-[40px] font-medium leading-[1.1]">Every call answered. Every open chair offered.</p>
        <p className="max-w-[440px] text-[#8C97A3]">Answers 24/7, books into your schedule, texts deposit links and brings patients back with recall.</p>
      </aside>
    </div>
  );
}
