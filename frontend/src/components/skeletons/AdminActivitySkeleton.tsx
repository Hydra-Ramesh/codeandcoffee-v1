import React from 'react';

export default function AdminActivitySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 bg-gradient-to-br from-slate-900/60 to-transparent"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="w-4 h-4 rounded bg-slate-800/80" />
            </div>
            <div className="h-8 w-16 bg-slate-800 rounded-lg" />
            <div className="h-2.5 w-32 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid: Feed + Top Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Feed (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="h-4 w-40 bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-800/60 rounded" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-36 bg-slate-800 rounded" />
                    <div className="h-2.5 w-12 bg-slate-800/50 rounded" />
                  </div>
                  <div className="h-3 w-56 bg-slate-800/70 rounded" />
                  <div className="h-2.5 w-24 bg-slate-800/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Questions Ranking (1 col) */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-12 bg-slate-800/60 rounded" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2"
              >
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 w-36 bg-slate-800 rounded" />
                  <div className="h-2.5 w-20 bg-slate-800/50 rounded" />
                </div>
                <div className="h-5 w-14 bg-slate-800/80 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
