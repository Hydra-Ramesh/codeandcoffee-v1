import React from 'react';

export default function AdminCoursesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 3 Course Cards */}
      {[1, 2, 3].map((card) => (
        <div
          key={card}
          className="glass-card rounded-2xl border border-slate-200 dark:border-white/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white/70 dark:bg-slate-900/60"
        >
          <div className="space-y-3 flex-1 min-w-0">
            {/* Badges: Level, Category, Status */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-20 rounded-full bg-amber-500/20" />
              <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* Course Title */}
            <div className="h-6 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-lg" />

            {/* Course Description */}
            <div className="space-y-1.5 max-w-xl">
              <div className="h-3.5 w-full bg-slate-200/70 dark:bg-slate-800/60 rounded" />
              <div className="h-3.5 w-4/5 bg-slate-200/50 dark:bg-slate-800/40 rounded" />
            </div>

            {/* Curriculum Metrics */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/70 rounded" />
              <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800/70 rounded" />
              <div className="h-4 w-28 bg-slate-200/80 dark:bg-slate-800/70 rounded" />
              <div className="h-4 w-24 bg-slate-200/80 dark:bg-slate-800/70 rounded" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <div className="h-9 w-32 rounded-xl bg-amber-500/30" />
            <div className="h-9 w-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
