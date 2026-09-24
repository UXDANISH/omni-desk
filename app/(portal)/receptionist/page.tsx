import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { db } from '@/lib/db';
import { ReceptionistForm } from './ReceptionistForm';

export const metadata: Metadata = { title: 'AI Receptionist' };

export default async function ReceptionistPage() {
  const user = await requireUser();
  return <ReceptionistForm initial={db.receptionist} readOnly={!can(user.role, 'editReceptionist')} />;
}
