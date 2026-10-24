'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder to avoid layout shift and SSR hydration mismatch
    return (
      <div
        className={`w-10 h-10 rounded-xl glass-card flex items-center justify-center opacity-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      className={`group relative flex items-center justify-center gap-2 p-2.5 rounded-xl glass-card border transition-all duration-300 hover:scale-105 active:scale-95 ${
        isDark
          ? 'border-white/10 hover:border-amber-400/50 hover:bg-amber-500/10 text-amber-400 shadow-lg shadow-black/20'
          : 'border-slate-300 hover:border-amber-500 hover:bg-amber-100/50 text-amber-600 shadow-md shadow-amber-500/10'
      } ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-all duration-500 transform rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 transition-all duration-500 transform -rotate-12 hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold tracking-wide capitalize select-none">
          {isDark ? 'Night Theme' : 'Day Theme'}
        </span>
      )}

      {/* Subtle indicator dot */}
      <span
        className={`absolute -top-1 -right-1 w-2 h-2 rounded-full transition-colors ${
          isDark ? 'bg-amber-400' : 'bg-indigo-500'
        }`}
      />
    </button>
  );
}
