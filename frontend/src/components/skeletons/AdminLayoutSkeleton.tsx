import React from 'react';

export default function AdminLayoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="lg:col-span-3 space-y-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-slate-800" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-28 bg-slate-800 rounded" />
              <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-full rounded-xl bg-slate-800/50" />
            ))}
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="h-8 w-full rounded-xl bg-slate-800/40" />
          </div>
        </div>
      </aside>

      {/* Main Content Area Skeleton */}
      <main className="lg:col-span-9 space-y-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-slate-800 rounded-xl" />
            <div className="h-3.5 w-80 bg-slate-800/60 rounded" />
          </div>
          <div className="h-9 w-32 bg-slate-800 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl glass-card" />
          ))}
        </div>

        <div className="h-64 rounded-2xl glass-card" />
      </main>
    </div>
  );
}
