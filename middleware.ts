import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

// Edge check of the signed Auth.js cookie only. Pages and API routes re-check the
// session against Postgres (lib/auth.ts), so a revoked device is rejected there.
const { auth } = NextAuth(authConfig);

const PUBLIC = ['/login', '/invite', '/reset', '/api/auth', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/icon.svg'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) return NextResponse.next();
  if (req.auth?.user) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
