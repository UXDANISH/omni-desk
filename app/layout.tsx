import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Bodoni_Moda, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { SITE } from '@/lib/site';
import './globals.css';

const display = Bodoni_Moda({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-display', display: 'swap' });
const sans = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — AI receptionist for dental practices`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: 'OmniAI' }],
  creator: 'OmniAI',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — AI receptionist for dental practices`,
    description: SITE.description,
    url: SITE.url,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', title: SITE.name, description: SITE.description },
  icons: { icon: '/icon.svg' },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8F9' },
    { media: '(prefers-color-scheme: dark)', color: '#08090B' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme lives in a cookie so the server renders the right theme with no flash. Light by default.
  const theme = (await cookies()).get('cf_theme')?.value === 'dark' ? 'dark' : 'light';
  return (
    <html lang="en" data-theme={theme} className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
