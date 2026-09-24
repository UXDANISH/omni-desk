import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Logo, Wordmark } from '@/components/ui/Logo';
import { LoginForm } from './LoginForm';
import { SITE } from '@/lib/site';

// The one public, indexable page of the portal.
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to OmniDesk to see the calls, bookings, recall and deposits your AI receptionist handled for your dental practice.',
  alternates: { canonical: '/login' },
  robots: { index: true, follow: true },
  openGraph: { title: 'Sign in to OmniDesk', url: `${SITE.url}/login` },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'OmniDesk',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SITE.description,
  publisher: { '@type': 'Organization', name: 'OmniAI' },
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main id="main" className="flex flex-col justify-center gap-8 px-6 py-12 sm:px-12">
        <div className="flex items-center gap-2.5"><Logo /><Wordmark /></div>
        <div className="flex w-full max-w-[400px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-medium leading-tight tracking-[-0.01em]">Sign in to your practice</h1>
            <p className="text-muted">See what your AI receptionist handled and what still needs your team.</p>
          </div>
          <Suspense>
            <LoginForm demo={SITE.demo} />
          </Suspense>
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
