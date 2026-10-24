import React from 'react';

export default function ArticleDetailSkeleton() {
  return (
    <article className="max-w-4xl mx-auto py-6 space-y-8 animate-pulse">
      {/* Back button & category badge skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-800 rounded-lg" />
        <div className="h-6 w-24 bg-slate-800 rounded-full" />
      </div>

      {/* Main header skeleton */}
      <div className="space-y-4">
        <div className="space-y-2.5">
          <div className="h-10 sm:h-12 w-11/12 bg-slate-800 rounded-2xl" />
          <div className="h-10 sm:h-12 w-3/4 bg-slate-800 rounded-2xl" />
        </div>

        <div className="space-y-2 pt-1">
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-5/6 bg-slate-800/60 rounded" />
        </div>

        {/* Author & Telemetry Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-slate-700" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-slate-800 rounded" />
              <div className="h-3 w-40 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="h-7 w-32 bg-slate-800/70 rounded-full" />
        </div>
      </div>

      {/* Hero Banner Image Skeleton */}
      <div className="h-72 sm:h-96 w-full rounded-3xl bg-slate-800/70 border border-white/5" />

      {/* Reaction Bar Skeleton */}
      <div className="flex items-center justify-between p-4 rounded-2xl glass-card border border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-20 bg-slate-800 rounded-xl" />
          <div className="h-9 w-20 bg-slate-800 rounded-xl" />
        </div>
        <div className="h-9 w-24 bg-slate-800 rounded-xl" />
      </div>

      {/* Markdown Body Skeleton */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/5 space-y-5">
        <div className="h-6 w-1/3 bg-slate-800 rounded-lg" />
        <div className="space-y-2.5">
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-4/5 bg-slate-800/60 rounded" />
        </div>

        {/* Code block skeleton */}
        <div className="h-44 w-full rounded-2xl bg-slate-950/80 border border-white/5 p-4 space-y-2">
          <div className="h-3 w-32 bg-slate-800 rounded" />
          <div className="h-3 w-3/4 bg-slate-800/70 rounded" />
          <div className="h-3 w-1/2 bg-slate-800/70 rounded" />
          <div className="h-3 w-2/3 bg-slate-800/70 rounded" />
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-4 w-11/12 bg-slate-800/60 rounded" />
        </div>
      </div>
    </article>
  );
}
