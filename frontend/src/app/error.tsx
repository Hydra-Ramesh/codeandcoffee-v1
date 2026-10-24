'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, BookOpen } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime client error for observability
    console.error('⚠️ [Client Error Boundary Captured]:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-red-500/30 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Something Went Wrong</h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            An unexpected error occurred while rendering this view. Our observability monitors have flagged this issue.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-gray-500 pt-1">
              Incident Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-card text-white hover:bg-white/10 text-xs font-semibold border border-white/10 flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-3.5 h-3.5" /> Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
