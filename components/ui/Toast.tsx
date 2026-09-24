'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const Ctx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((m: string) => {
    clearTimeout(t.current);
    setMsg(m);
    t.current = setTimeout(() => setMsg(''), 3800);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[80] flex justify-center px-4 md:bottom-6">
        {msg && <div className="max-w-full rounded-[10px] bg-ink px-[18px] py-3 text-sm text-surface shadow-pop">{msg}</div>}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
