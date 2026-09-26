import { useState, useCallback } from 'react';
import { toggleThemeReveal } from '@omega-os/ui';

export const generateStackId = (): string => {
  try {
    return `item-${crypto.randomUUID()}`;
  } catch {
    return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
};

export const useAppTheme = () => {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  const toggleTheme = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const x = e.clientX || window.innerWidth - 60;
      const y = e.clientY || 40;
      toggleThemeReveal(x, y, () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
      });
    },
    [dark],
  );

  return { dark, toggleTheme };
};
