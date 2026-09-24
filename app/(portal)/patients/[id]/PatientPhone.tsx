'use client';

import { useState } from 'react';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { useSession } from '@/components/shell/SessionProvider';

export function PatientPhone({ id, last4 }: { id: string; last4: string }) {
  const { user } = useSession();
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <MaskedPhone kind="patient" id={id} last4={last4} large onRevealChange={setRevealed} />
      {revealed && <span className="text-xs text-muted">Revealed by {user.name}. Re-masks in 15s. This view is logged.</span>}
    </>
  );
}
