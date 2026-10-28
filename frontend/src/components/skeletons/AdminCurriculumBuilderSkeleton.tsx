import React from 'react';

export default function AdminCurriculumBuilderSkeleton() {
  return (
    <div className="space-y-8 animate-pulse pb-20">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-5 w-20 rounded-full bg-amber-500/20" />
            <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-9 w-36 rounded-xl bg-amber-500/30" />
        </div>
      </div>

      {/* Curriculum Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-card p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 space-y-2"
          >
            <div className="h-3 w-20 bg-slate-200/80 dark:bg-slate-800/70 rounded" />
            <div className="h-6 w-12 bg-amber-500/30 rounded" />
          </div>
        ))}
      </div>

      {/* Module 1 (Expanded) */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/70 dark:bg-slate-900/60 shadow-lg">
        {/* Module Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-slate-100/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20" />
            <div className="space-y-1.5">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-32 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 rounded-xl bg-amber-500/20" />
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Lessons Subtopics List */}
        <div className="p-4 space-y-2.5">
          {[1, 2, 3].map((lesson) => (
            <div
              key={lesson}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-16 bg-slate-200/70 dark:bg-slate-800/60 rounded-full" />
                    <div className="h-3 w-20 bg-emerald-500/20 rounded-full" />
                    <div className="h-3 w-20 bg-amber-500/20 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-7 w-16 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 2 (Collapsed) */}
      <div className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-4 sm:p-5 flex items-center justify-between bg-white/70 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
