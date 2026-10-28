import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-pulse">
      {/* Profile Header Card Skeleton */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 relative overflow-hidden shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Skeleton */}
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700/50 shadow-xl shrink-0" />

          {/* Details Skeleton */}
          <div className="flex-1 w-full text-center sm:text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2 flex flex-col items-center sm:items-start">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-5 w-20 bg-slate-200/80 dark:bg-slate-800/60 rounded-md" />
                </div>
                <div className="h-3.5 w-36 bg-slate-200/80 dark:bg-slate-800/60 rounded" />
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="h-3.5 w-full bg-slate-200/80 dark:bg-slate-800/60 rounded" />
              <div className="h-3.5 w-4/5 bg-slate-200/80 dark:bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Liked Publications Skeleton */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-white/[0.02] p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between"
            >
              <div className="space-y-2 flex-1 pr-3">
                <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Discussion Comments Skeleton */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-52 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>

        <div className="space-y-3 pt-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-2"
            >
              <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-200/80 dark:bg-slate-800/60 rounded" />
              <div className="h-2.5 w-24 bg-slate-200/60 dark:bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
