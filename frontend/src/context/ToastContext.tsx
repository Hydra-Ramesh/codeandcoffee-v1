'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, options?: { action?: ToastAction; durationMs?: number }) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
  error: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
  warning: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
  info: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
  toast: {
    success: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
    error: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
    warning: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
    info: (message: string, options?: { action?: ToastAction; durationMs?: number }) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', options?: { action?: ToastAction; durationMs?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const durationMs = options?.durationMs ?? (options?.action ? 6000 : 4000);

      const newToast: ToastItem = {
        id,
        type,
        message,
        action: options?.action,
        durationMs,
      };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, opts?: { action?: ToastAction; durationMs?: number }) => addToast(msg, 'success', opts),
    [addToast]
  );
  const error = useCallback(
    (msg: string, opts?: { action?: ToastAction; durationMs?: number }) => addToast(msg, 'error', opts),
    [addToast]
  );
  const warning = useCallback(
    (msg: string, opts?: { action?: ToastAction; durationMs?: number }) => addToast(msg, 'warning', opts),
    [addToast]
  );
  const info = useCallback(
    (msg: string, opts?: { action?: ToastAction; durationMs?: number }) => addToast(msg, 'info', opts),
    [addToast]
  );

  const toastMethods = { success, error, warning, info };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, toast: toastMethods }}>
      {children}
      {/* Toast Notification Viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl glass-card border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-up ${
                isSuccess
                  ? 'border-emerald-500/30 bg-slate-950/85 text-emerald-300 shadow-emerald-500/10'
                  : isError
                  ? 'border-red-500/30 bg-slate-950/85 text-red-300 shadow-red-500/10'
                  : isWarning
                  ? 'border-amber-500/30 bg-slate-950/85 text-amber-300 shadow-amber-500/10'
                  : 'border-cyan-500/30 bg-slate-950/85 text-cyan-300 shadow-cyan-500/10'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
                  {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-cyan-400" />}
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-100 leading-snug break-words">
                  {t.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {t.action && (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      removeToast(t.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
