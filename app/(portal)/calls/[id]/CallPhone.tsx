'use client';

import { useState } from 'react';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { useSession } from '@/components/shell/SessionProvider';

export function CallPhone({ id, last4, meta }: { id: string; last4: string; meta: string }) {
  const { user } = useSession();
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-mono text-xs text-muted">
        <MaskedPhone kind="call" id={id} last4={last4} large onRevealChange={setRevealed} />
        <span>{meta}</span>
      </div>
      {revealed && <span className="text-xs text-muted">Number revealed by {user.name}. Re-masks in 15s. This view is logged.</span>}
    </>
  );
}
