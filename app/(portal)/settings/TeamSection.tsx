'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Pill } from '@/components/ui/Pill';
import { LockedNote } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Segmented } from '@/components/ui/Segmented';
import { ActionButton } from '@/components/ui/ActionButton';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import { PERMISSION_TABLE, can } from '@/lib/permissions';
import { ROLES, type PlanName, type Role, type TeamMember } from '@/lib/types';

const COLS = 'grid-cols-[minmax(210px,1.5fr)_minmax(150px,1fr)_150px_110px_120px]';
const PERM_COLS = 'grid-cols-[minmax(220px,1.8fr)_repeat(3,minmax(84px,1fr))]';

export function TeamSection({ team, me, role, plan }: { team: Omit<TeamMember, 'last4'>[]; me: string; role: Role; plan: PlanName }) {
  const router = useRouter();
  const toast = useToast();
  const owner = role === 'Owner';

  async function setRole(id: string, newRole: string) {
    const r = await api<{ message: string }>(`/api/team/${id}`, 'PATCH', { role: newRole });
    toast(r.ok ? r.data.message : r.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {!owner && <LockedNote>{role === 'Front desk' ? 'View only. Ask an Owner or Manager to invite someone or change a role.' : 'You can invite teammates. Only the Owner can change roles or remove people.'}</LockedNote>}

      <div role="table" aria-label="Team" className="cf-card overflow-x-auto xl:overflow-visible">
        <div className="min-w-[820px] xl:min-w-0">
          <div role="row" className={clsx('cf-th static xl:sticky', COLS)}><span>Person</span><span>Role</span><span>Last active</span><span>Status</span><span /></div>
          {team.map((t) => {
            const isMe = t.id === me;
            const editable = owner && t.role !== 'Owner' && !isMe;
            return (
              <div role="row" key={t.id} className={clsx('cf-row', COLS)}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-surface2 text-[13px] font-semibold">{t.initials}</span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 font-medium">{t.name}{isMe && <span className="rounded-[3px] border px-1 font-mono text-[10px] tracking-[0.06em] text-muted">YOU</span>}</span>
                    <span className="truncate font-mono text-xs text-muted">{t.email}</span>
                  </span>
                </span>
                <span>
                  {editable ? (
                    <select aria-label={`Role for ${t.name}`} defaultValue={t.role} onChange={(e) => setRole(t.id, e.target.value)} className="cf-input h-9 max-w-[160px]">
                      <option value="Manager">Manager</option>
                      <option value="Front desk">Front desk</option>
                    </select>
                  ) : t.role}
                </span>
                <span className="font-mono text-xs text-muted">{t.lastActive}</span>
                <span><Pill tone={t.status === 'Active' ? 'ok' : 'warn'}>{t.status}</Pill></span>
                <span className="text-right">
                  {t.status === 'Invited' && role !== 'Front desk' ? (
                    <ActionButton url={`/api/team/${t.id}`} method="PATCH" body={{ resendInvite: true }} className="cf-btn h-8 px-2.5 text-[13px]">Resend invite</ActionButton>
                  ) : editable ? (
                    <ActionButton url={`/api/team/${t.id}`} method="DELETE" className="cf-btn h-8 px-2.5 text-[13px]">Remove</ActionButton>
                  ) : null}
                </span>
              </div>
            );
          })}
          <div className="px-5 py-3 font-mono text-[11px] text-muted">
            {team.filter((t) => t.status === 'Active').length} ACTIVE · {team.filter((t) => t.status === 'Invited').length} INVITED · UNLIMITED SEATS ON {plan.toUpperCase()}
          </div>
        </div>
      </div>

      <section className="cf-card overflow-x-auto" aria-labelledby="perm-h">
        <div className="min-w-[560px]">
          <div className="flex flex-col gap-0.5 border-b px-5 py-4">
            <h2 id="perm-h" className="text-base font-semibold">What each role can do</h2>
            <p className="text-[13px] text-muted">Roles are fixed for now. Only the Owner can change someone&apos;s role.</p>
          </div>
          <div role="row" className={clsx('grid h-[42px] items-center gap-4 border-b bg-surface2 px-5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted', PERM_COLS)}>
            <span>Permission</span>
            {ROLES.map((r) => <span key={r} className={clsx('text-center', r === role && 'font-semibold text-accent-tx')}>{r}{r === role ? ' · you' : ''}</span>)}
          </div>
          {PERMISSION_TABLE.map((p) => (
            <div role="row" key={p.label} className={clsx('grid min-h-12 items-center gap-4 border-b px-5 py-1.5 last:border-b-0', PERM_COLS)}>
              <span>{p.label}</span>
              {ROLES.map((r) => {
                const yes = can(r, p.perm);
                return (
                  <span key={r} aria-label={`${r}: ${yes ? 'allowed' : 'not allowed'}`} className={clsx('grid h-8 place-items-center rounded-md', r === role && 'bg-accent-bg')}>
                    {yes ? <Icon name="check" size={16} strokeWidth={2.2} className="text-ok" /> : <span className="h-0.5 w-3 rounded-sm bg-line" />}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function InviteButton({ canInviteManagers }: { canInviteManagers: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Manager' | 'Front desk'>('Front desk');
  const valid = /.+@.+\..+/.test(email);

  async function send() {
    const r = await api<{ message: string; inviteUrl?: string }>('/api/team', 'POST', { email, role });
    if (!r.ok) return toast(r.error);
    // Development only, until email is connected: hand over the link directly.
    const copied = r.data.inviteUrl && (await navigator.clipboard?.writeText(r.data.inviteUrl).then(() => true, () => false));
    toast(r.data.inviteUrl ? `Invite created. Email isn't connected yet — ${copied ? 'the link was copied to your clipboard' : 'the link is in the server log'}.` : r.data.message);
    setOpen(false);
    setEmail('');
    router.refresh();
  }

  return (
    <>
      <button type="button" className="cf-btn-primary h-[38px]" onClick={() => setOpen(true)}>Invite teammate</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a teammate"
        footer={<><button type="button" className="cf-btn h-10" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="cf-btn-primary" disabled={!valid} onClick={send}>Send invite</button></>}
      >
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">Work email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@smiledental.example" className="cf-input font-mono text-[13px]" />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="cf-label">Role</span>
          <Segmented label="Role" value={role} onChange={setRole} options={(canInviteManagers ? (['Manager', 'Front desk'] as const) : (['Front desk'] as const)).map((r) => ({ value: r, label: r }))} />
          <span className="text-xs text-muted">
            {role === 'Manager' ? 'Managers can change AI settings, refund deposits, and see billing.' : "Front desk can work calls, recall, and bookings. They can't see billing or deposit totals."}
          </span>
        </div>
      </Modal>
    </>
  );
}
