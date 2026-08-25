import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Moon, Sun } from 'lucide-react';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
  };

  if (!mounted) return null;

  return createPortal(
    <button
      onClick={toggleTheme}
      type="button"
      style={{ zIndex: 999999 }}
      className="fixed bottom-8 right-8 flex items-center justify-center w-14 h-14 rounded-full bg-[var(--text)] text-[var(--bg)] shadow-2xl hover:scale-110 active:scale-95 focus-visible:ring-4 focus-visible:ring-blue-500 transition-all duration-300 outline-none"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Sun className="w-5 h-5" aria-hidden="true" />
      )}
    </button>,
    document.body
  );
};

export default ThemeSwitcher;