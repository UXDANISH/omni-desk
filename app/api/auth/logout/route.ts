import { NextResponse } from 'next/server';
import { auth, signOut } from '@/auth';
import { deleteAuthSession } from '@/lib/db';

export async function POST() {
  const s = await auth();
  if (s?.sid) await deleteAuthSession(s.sid);
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
