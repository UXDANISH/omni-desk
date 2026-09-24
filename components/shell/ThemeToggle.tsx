'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export type ThemePref = 'light' | 'dark' | 'system';

export function applyTheme(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.cookie = `cf_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  document.cookie = `cf_theme_pref=${pref}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new CustomEvent('cf-theme', { detail: theme }));
  return theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    const on = (e: Event) => setTheme((e as CustomEvent).detail);
    window.addEventListener('cf-theme', on);
    return () => window.removeEventListener('cf-theme', on);
  }, []);
  return theme;
}

export function ThemeToggle() {
  const theme = useTheme();
  const label = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  return (
    <button type="button" onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')} aria-label={label} title={label} className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-lg border bg-surface hover:border-accent">
      <Icon name={theme === 'light' ? 'moon' : 'sun'} />
    </button>
  );
}
