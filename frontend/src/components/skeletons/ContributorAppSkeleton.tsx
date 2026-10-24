import React from 'react';

export default function ContributorAppSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 shadow-lg"
        >
          {/* Top Row: User Meta + Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-4 w-28 bg-slate-800/70 rounded" />
                </div>
                <div className="h-3 w-40 bg-slate-800/60 rounded" />
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="h-6 w-24 bg-slate-800/80 rounded-full" />
              <div className="h-3 w-20 bg-slate-800/50 rounded" />
            </div>
          </div>

          {/* Statement Box */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="h-3 w-48 bg-slate-800/70 rounded" />
            <div className="space-y-1.5 pt-1">
              <div className="h-3.5 w-full bg-slate-800/60 rounded" />
              <div className="h-3.5 w-5/6 bg-slate-800/60 rounded" />
            </div>
          </div>

          {/* Footer: Resume link + Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div className="h-8 w-36 bg-slate-800 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-36 bg-slate-800 rounded-xl" />
              <div className="h-8 w-24 bg-slate-800 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
