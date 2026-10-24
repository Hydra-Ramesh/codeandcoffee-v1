import React from 'react';

export default function EditorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-slate-800 rounded-lg" />
            <div className="h-3 w-64 bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>

      {/* Metadata Configuration Inputs Skeleton */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-slate-800 rounded" />
          <div className="h-11 w-full bg-slate-800/70 rounded-xl" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-28 bg-slate-800 rounded" />
          <div className="h-16 w-full bg-slate-800/60 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-32 bg-slate-800 rounded" />
          <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
        </div>
      </div>

      {/* Editor Body Skeleton */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        {/* Formatting toolbar shimmer */}
        <div className="h-10 w-full rounded-xl bg-slate-800/70 border border-white/5" />

        {/* Editor & Preview Area */}
        <div className="h-96 w-full rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-3">
          <div className="h-4 w-1/3 bg-slate-800 rounded" />
          <div className="h-3.5 w-full bg-slate-800/50 rounded" />
          <div className="h-3.5 w-5/6 bg-slate-800/50 rounded" />
          <div className="h-28 w-full bg-slate-950/80 rounded-xl border border-white/5" />
          <div className="h-3.5 w-2/3 bg-slate-800/50 rounded" />
        </div>

        {/* Footer Save Button */}
        <div className="flex justify-end pt-2">
          <div className="h-11 w-40 bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
