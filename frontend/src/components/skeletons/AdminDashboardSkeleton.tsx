import React from 'react';

export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-800 rounded-xl" />
          <div className="h-3.5 w-96 bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-slate-800 rounded" />
              <div className="w-4 h-4 rounded bg-slate-800" />
            </div>
            <div className="h-8 w-16 bg-slate-800 rounded-lg" />
            <div className="h-3 w-36 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Top Performing Publications Table Skeleton */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-slate-800 rounded" />
          <div className="h-3 w-20 bg-slate-800/60 rounded" />
        </div>

        <div className="space-y-3 pt-2">
          {/* Table Header */}
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <div className="h-3 w-40 bg-slate-800/60 rounded" />
            <div className="h-3 w-16 bg-slate-800/60 rounded" />
            <div className="h-3 w-12 bg-slate-800/60 rounded" />
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
            <div className="h-3 w-12 bg-slate-800/60 rounded" />
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="space-y-1.5 w-1/3">
                <div className="h-4 w-5/6 bg-slate-800 rounded" />
              </div>
              <div className="h-4 w-16 bg-slate-800/70 rounded" />
              <div className="h-4 w-10 bg-slate-800/70 rounded" />
              <div className="h-4 w-20 bg-slate-800/70 rounded" />
              <div className="h-4 w-12 bg-slate-800/70 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users Overview Table Skeleton */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-slate-800 rounded" />
          <div className="h-3 w-36 bg-slate-800/60 rounded" />
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center justify-between py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-slate-800 rounded" />
                  <div className="h-3 w-40 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-slate-800/70 rounded-md" />
              <div className="h-3.5 w-24 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
