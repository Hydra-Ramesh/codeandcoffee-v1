import React from 'react';
import PracticeQuestionsSkeleton from '../../components/skeletons/PracticeQuestionsSkeleton';

export default function PracticeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10">
        <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="h-6 w-48 bg-amber-500/20 rounded-full" />
            <div className="h-10 w-80 sm:w-96 bg-slate-800 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-full bg-slate-800/70 rounded" />
              <div className="h-3.5 w-3/4 bg-slate-800/60 rounded" />
            </div>
          </div>

          {/* Metrics Cards Skeletons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full 2xl:w-auto shrink-0">
            {/* Daily Streak Card Skeleton */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/60 space-y-3 w-full sm:w-[290px] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="space-y-1">
                    <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
                    <div className="h-5 w-24 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-2.5 w-16 bg-slate-800/60 rounded ml-auto" />
                  <div className="h-3.5 w-10 bg-slate-800 rounded ml-auto" />
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-800/60 rounded" />
                <div className="h-3 w-28 bg-slate-800 rounded" />
              </div>
            </div>

            {/* Points Card Skeleton */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/60 space-y-3 w-full sm:w-[290px] shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20" />
                  <div className="space-y-1">
                    <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
                    <div className="h-5 w-24 bg-amber-500/30 rounded" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="h-2.5 w-16 bg-slate-800/60 rounded ml-auto" />
                  <div className="h-4 w-12 bg-slate-800 rounded ml-auto" />
                </div>
              </div>
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-slate-800/60 rounded" />
                  <div className="h-3 w-16 bg-amber-500/30 rounded" />
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 365-Day Activity Heatmap Skeleton */}
      <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 bg-slate-950/70 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="h-5 w-64 bg-slate-800 rounded-md" />
            <div className="h-3 w-96 bg-slate-800/60 rounded" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-7 w-28 bg-slate-800/80 rounded-xl" />
            <div className="h-7 w-28 bg-slate-800/80 rounded-xl" />
            <div className="h-7 w-28 bg-slate-800/80 rounded-xl" />
          </div>
        </div>
        <div className="h-28 bg-slate-900/60 rounded-xl" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[1, 2, 3, 4, 5].map((t) => (
          <div key={t} className="h-10 w-36 bg-slate-800/80 rounded-2xl shrink-0" />
        ))}
      </div>

      {/* Questions List Skeleton */}
      <PracticeQuestionsSkeleton />
    </div>
  );
}
