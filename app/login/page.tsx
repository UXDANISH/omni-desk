import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthLayout } from '@/components/shell/AuthLayout';
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
    <AuthLayout
      title="Sign in to your practice"
      intro="See what your AI receptionist handled and what still needs your team."
      before={<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    >
      <Suspense>
        <LoginForm demo={SITE.demo} />
      </Suspense>
    </AuthLayout>
  );
}
