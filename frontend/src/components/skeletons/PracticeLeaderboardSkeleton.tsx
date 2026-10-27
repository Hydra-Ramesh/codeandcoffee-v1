import React from 'react';

export default function PracticeLeaderboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top 3 Podium Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-end">
        {/* Rank 2 (Left) */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 text-center space-y-3 order-2 md:order-1">
          <div className="h-5 w-24 bg-slate-800 rounded-full mx-auto" />
          <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto" />
          <div className="h-4 w-32 bg-slate-800 rounded mx-auto" />
          <div className="p-3 rounded-xl bg-slate-900/60 space-y-2">
            <div className="h-5 w-20 bg-slate-800 rounded mx-auto" />
            <div className="h-3 w-28 bg-slate-800/60 rounded mx-auto" />
          </div>
        </div>

        {/* Rank 1 (Center - Elevated) */}
        <div className="glass-card rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-7 text-center space-y-3.5 order-1 md:order-2 md:-translate-y-3 shadow-lg">
          <div className="h-6 w-28 bg-amber-500/20 rounded-full mx-auto" />
          <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto ring-4 ring-amber-500/10" />
          <div className="h-5 w-36 bg-slate-800 rounded mx-auto" />
          <div className="p-3.5 rounded-xl bg-slate-900/70 space-y-2 border border-white/5">
            <div className="h-6 w-24 bg-amber-500/30 rounded mx-auto" />
            <div className="h-3 w-32 bg-slate-800/60 rounded mx-auto" />
            <div className="h-2.5 w-40 bg-slate-800/50 rounded mx-auto" />
          </div>
        </div>

        {/* Rank 3 (Right) */}
        <div className="glass-card rounded-2xl border border-white/10 p-6 text-center space-y-3 order-3">
          <div className="h-5 w-24 bg-slate-800 rounded-full mx-auto" />
          <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto" />
          <div className="h-4 w-32 bg-slate-800 rounded mx-auto" />
          <div className="p-3 rounded-xl bg-slate-900/60 space-y-2">
            <div className="h-5 w-20 bg-slate-800 rounded mx-auto" />
            <div className="h-3 w-28 bg-slate-800/60 rounded mx-auto" />
          </div>
        </div>
      </div>

      {/* User Standing Bar Skeleton */}
      <div className="p-4 rounded-2xl glass-card border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-8 rounded-xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-slate-800/60 rounded" />
            <div className="h-4 w-44 bg-slate-800 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-28 bg-slate-800 rounded-lg" />
          <div className="h-7 w-24 bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Leaderboard Table Skeleton */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.01]">
          <div className="h-4 w-48 bg-slate-800 rounded" />
          <div className="h-9 w-64 bg-slate-800/60 rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5"><div className="h-3 w-10 bg-slate-800/60 rounded mx-auto" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-24 bg-slate-800/60 rounded" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-20 bg-slate-800/60 rounded mx-auto" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-16 bg-slate-800/60 rounded mx-auto" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-20 bg-slate-800/60 rounded mx-auto" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-24 bg-slate-800/60 rounded mx-auto" /></th>
                <th className="px-5 py-3.5 text-right"><div className="h-3 w-16 bg-slate-800/60 rounded ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <tr key={row} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5"><div className="h-4 w-8 bg-slate-800 rounded mx-auto" /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
                      <div className="space-y-1">
                        <div className="h-3.5 w-28 bg-slate-800 rounded" />
                        <div className="h-2.5 w-16 bg-slate-800/50 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><div className="h-5 w-20 bg-slate-800/60 rounded-md mx-auto" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 w-16 bg-amber-500/15 rounded-md mx-auto" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 w-16 bg-slate-800/60 rounded-md mx-auto" /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      {Array.from({ length: 14 }).map((_, d) => (
                        <div key={d} className="w-3 h-3 rounded-xs bg-slate-800/60" />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right"><div className="h-3 w-14 bg-slate-800/50 rounded ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
