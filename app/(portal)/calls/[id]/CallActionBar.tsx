import { ActionButton } from '@/components/ui/ActionButton';
import { Icon } from '@/components/ui/Icon';
import type { Outcome } from '@/lib/types';

/** The call's single primary action: take over a live call, or call back. */
export function CallActionBar({ id, outcome, resolved }: { id: string; outcome: Outcome; resolved: boolean }) {
  const label = resolved ? (outcome === 'Resolved' ? 'Resolved' : 'Call placed') : outcome === 'Live' ? 'Take over call' : outcome === 'Needs human' ? 'Call back now' : 'Call back';
  const hint = resolved
    ? 'Marked resolved and removed from Needs attention.'
    : outcome === 'Live'
      ? 'OmniDesk will hand off and stay muted.'
      : 'Dials from your office line. Caller sees the practice number.';
  return (
    <div className="sticky bottom-[68px] flex items-center gap-3 rounded-b-xl border-t bg-surface px-5 py-3.5 md:bottom-0 md:px-6">
      <span className="flex-1 text-xs text-muted">{hint}</span>
      <ActionButton url={`/api/calls/${id}/callback`} className="cf-btn-primary h-11 px-5" disabled={resolved}>
        <Icon name="call" size={16} strokeWidth={2} />{label}
      </ActionButton>
    </div>
  );
}
