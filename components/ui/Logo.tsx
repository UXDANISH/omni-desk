import clsx from 'clsx';

/** The omni node-mesh ring. Dark-ground only, so it always sits in a dark chip. Placeholder until the real asset lands. */
export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span className={clsx('grid shrink-0 place-items-center rounded-[9px] bg-chip', className)} style={{ width: size, height: size }}>
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth=".55" role="img" aria-label="omni logo">
        <polygon points="22,12 20.66,17 17,20.66 12,22 7,20.66 3.34,17 2,12 3.34,7 7,3.34 12,2 17,3.34 20.66,7" />
        <polygon points="18.28,13.68 16.6,16.6 13.68,18.28 10.32,18.28 7.4,16.6 5.72,13.68 5.72,10.32 7.4,7.4 10.32,5.72 13.68,5.72 16.6,7.4 18.28,10.32" />
        <polyline points="22,12 18.28,13.68 20.66,17 16.6,16.6 17,20.66 13.68,18.28 12,22 10.32,18.28 7,20.66 7.4,16.6 3.34,17 5.72,13.68 2,12 5.72,10.32 3.34,7 7.4,7.4 7,3.34 10.32,5.72 12,2 13.68,5.72 17,3.34 16.6,7.4 20.66,7 18.28,10.32 22,12" />
        <g fill="#00E5FF" stroke="none">
          {[[22, 12], [17, 20.66], [7, 20.66], [2, 12], [7, 3.34], [17, 3.34]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1" />)}
          {[[20.66, 17], [12, 22], [3.34, 17], [3.34, 7], [12, 2], [20.66, 7]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r=".8" />)}
        </g>
      </svg>
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="flex flex-col leading-[1.15]">
      <span className="text-base font-semibold tracking-[-0.01em]">OmniDesk</span>
    </span>
  );
}
