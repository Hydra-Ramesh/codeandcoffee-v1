import React from 'react';

export default function AdminPracticeSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Table Skeleton Container */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5"><div className="h-3 w-28 bg-slate-800 rounded" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-36 bg-slate-800 rounded" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-16 bg-slate-800 rounded" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-20 bg-slate-800 rounded" /></th>
                <th className="px-5 py-3.5"><div className="h-3 w-16 bg-slate-800 rounded" /></th>
                <th className="px-5 py-3.5 text-right"><div className="h-3 w-16 bg-slate-800 rounded ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <tr key={row} className="hover:bg-white/[0.02]">
                  {/* Category / Sheet */}
                  <td className="px-5 py-3.5">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-800 rounded" />
                      <div className="h-2.5 w-24 bg-slate-800/60 rounded" />
                    </div>
                  </td>

                  {/* Title & tags */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-44 bg-slate-800 rounded" />
                      <div className="h-4 w-12 bg-slate-800/70 rounded" />
                      <div className="h-4 w-16 bg-slate-800/50 rounded" />
                    </div>
                  </td>

                  {/* Platform */}
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 w-16 bg-slate-800/60 rounded" />
                  </td>

                  {/* Difficulty */}
                  <td className="px-5 py-3.5">
                    <div className="h-5 w-16 bg-slate-800/80 rounded-md" />
                  </td>

                  {/* Author */}
                  <td className="px-5 py-3.5">
                    <div className="h-3.5 w-20 bg-slate-800/60 rounded" />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/70" />
                      <div className="w-7 h-7 rounded-lg bg-slate-800/70" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
