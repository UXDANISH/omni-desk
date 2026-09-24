import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="grid min-h-screen place-items-center p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <span className="cf-label">404</span>
        <h1 className="font-display text-3xl font-medium">Page not found</h1>
        <p className="text-muted">That page doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/overview" className="cf-btn mt-2">Back to Overview</Link>
      </div>
    </main>
  );
}
