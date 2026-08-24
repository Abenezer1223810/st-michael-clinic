import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialContrast() {
  if (typeof window === 'undefined') return 'normal';
  const stored = localStorage.getItem('contrast');
  if (stored === 'high' || stored === 'normal') return stored;
  return 'normal';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [contrast, setContrast] = useState(getInitialContrast);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', contrast === 'high');
    localStorage.setItem('contrast', contrast);
  }, [contrast]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const toggleContrast = () => setContrast((c) => (c === 'high' ? 'normal' : 'high'));

  return (
    <ThemeContext.Provider value={{ theme, toggle, contrast, toggleContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
