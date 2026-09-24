import type { Metadata } from 'next';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { getReceptionist } from '@/lib/db';
import { ReceptionistForm } from './ReceptionistForm';

export const metadata: Metadata = { title: 'AI Receptionist' };

export default async function ReceptionistPage() {
  const { user, practiceId } = await requireSession();
  return <ReceptionistForm initial={await getReceptionist(practiceId)} readOnly={!can(user.role, 'editReceptionist')} />;
}
