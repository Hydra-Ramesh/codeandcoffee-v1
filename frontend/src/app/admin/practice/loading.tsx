import React from 'react';
import AdminPracticeSkeleton from '../../../components/skeletons/AdminPracticeSkeleton';

export default function AdminPracticeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-white/10 bg-slate-900/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-32 bg-amber-500/20 rounded-md" />
            <div className="h-5 w-24 bg-slate-800 rounded-full" />
          </div>
          <div className="h-8 w-64 bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-800/60 rounded" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-amber-500/30 rounded-xl" />
        </div>
      </div>

      {/* Tabs Switcher Skeleton */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <div className="h-10 w-44 bg-slate-800 rounded-xl" />
        <div className="h-10 w-48 bg-slate-800/50 rounded-xl" />
      </div>

      {/* Filters Bar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="h-8 w-24 bg-slate-800 rounded-lg" />
          <div className="h-8 w-36 bg-slate-800/70 rounded-lg" />
          <div className="h-8 w-28 bg-slate-800/70 rounded-lg" />
          <div className="h-8 w-28 bg-slate-800/70 rounded-lg" />
          <div className="h-8 w-36 bg-slate-800/70 rounded-lg" />
        </div>
        <div className="h-8 w-64 bg-slate-800/60 rounded-xl" />
      </div>

      {/* Curriculum Table Skeleton */}
      <AdminPracticeSkeleton />
    </div>
  );
}
