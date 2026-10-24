'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Trash2, X, ArrowRight, ShieldCheck } from 'lucide-react';

export interface WarningDetail {
  label: string;
  value: string;
}

export interface WarningCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionVerb?: string;
  badgeText?: string;
  variant?: 'danger' | 'warning' | 'success';
  details?: WarningDetail[];
  confirmLoading?: boolean;
}

export default function WarningCardModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionVerb = 'Confirm & Apply',
  badgeText,
  variant = 'warning',
  details = [],
  confirmLoading = false,
}: WarningCardModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !confirmLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, confirmLoading]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className={`glass-card p-6 sm:p-8 rounded-3xl border max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden animate-scale-in ${
          isDanger
            ? 'border-red-500/40 bg-slate-950/95 shadow-red-500/10'
            : isSuccess
            ? 'border-emerald-500/40 bg-slate-950/95 shadow-emerald-500/10'
            : 'border-amber-500/40 bg-slate-950/95 shadow-amber-500/10'
        }`}
      >
        {/* Top Radial Glow Capsule */}
        <div
          className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isDanger ? 'bg-red-500' : isSuccess ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isDanger
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-6 h-6" />
              ) : isSuccess ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              {badgeText && (
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isDanger
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : isSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {badgeText}
                </span>
              )}
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={confirmLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed relative z-10">
          {description}
        </p>

        {/* Audit Details Card */}
        {details.length > 0 && (
          <div className="p-4 rounded-2xl bg-black/50 border border-white/5 space-y-2 text-xs relative z-10">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-gray-300">
                <span className="text-gray-400">{d.label}:</span>
                <span className="font-mono font-semibold text-white truncate max-w-[240px]">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Controls with 44px+ touch targets */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            disabled={confirmLoading}
            className="w-full sm:w-auto px-5 min-h-[44px] rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading}
            className={`w-full sm:w-auto px-6 min-h-[44px] rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/25'
                : isSuccess
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
            }`}
          >
            {confirmLoading ? (
              <span>Applying Changes...</span>
            ) : (
              <>
                <span>{actionVerb}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
