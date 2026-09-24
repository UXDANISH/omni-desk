'use client';

import { useEffect, useRef, useState } from 'react';
import { mmss } from '@/lib/format';

/** Placeholder until call recordings are wired up. Simulates playback position. */
export function AudioPlayer({ total }: { total: number }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => setT((x) => (x + 1 >= total ? (setPlaying(false), total) : x + 1)), 1000);
    return () => clearInterval(timer.current);
  }, [playing, total]);

  return (
    <div className="flex items-center gap-3 rounded-[10px] border px-3.5 py-3">
      <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause recording' : 'Play recording'} className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-ink text-surface">
        {playing ? (
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        ) : (
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-1 overflow-hidden rounded-sm bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={t} aria-label="Playback position">
          <div className="h-full bg-accent" style={{ width: `${Math.round((t / total) * 100)}%` }} />
        </div>
        <div className="flex justify-between font-mono text-[11px] text-muted"><span>{mmss(t)}</span><span>RECORDING · PLACEHOLDER</span><span>{mmss(total)}</span></div>
      </div>
    </div>
  );
}
