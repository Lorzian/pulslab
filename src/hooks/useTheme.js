import { useEffect, useState } from 'react';
const STORAGE_KEY = 'pulslab-theme';
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Stocarea locală poate fi blocată de browser. Tema funcționează și fără ea. */
    }
  }, [theme]);
  return [theme, setTheme];
}
