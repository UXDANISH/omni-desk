'use client';

import { createContext, useContext } from 'react';
import type { Role } from '@/lib/types';

export interface SessionUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
}
export interface SwitchCandidate {
  id: string;
  name: string;
  initials: string;
  role: Role;
  lastActive: string;
}

const Ctx = createContext<{ user: SessionUser; team: SwitchCandidate[]; practice: string } | null>(null);

export function SessionProvider({ user, team, practice, children }: { user: SessionUser; team: SwitchCandidate[]; practice: string; children: React.ReactNode }) {
  return <Ctx.Provider value={{ user, team, practice }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be used inside SessionProvider');
  return v;
}
