import React from 'react';

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
  hasAvatar?: boolean;
}

export default function AdminTableSkeleton({
  columns = 6,
  rows = 6,
  hasAvatar = false,
}: AdminTableSkeletonProps) {
  return (
    <div className="overflow-x-auto animate-pulse">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4">
                <div className={`h-3 bg-slate-200 dark:bg-slate-800 rounded ${i === 0 ? 'w-24' : 'w-16'}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              {/* Primary Col 1 (e.g. Title / User) */}
              <td className="p-4">
                {hasAvatar ? (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ) : (
                  <div className="space-y-1.5 max-w-xs">
                    <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-32 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                  </div>
                )}
              </td>

              {/* Col 2 (Category / Email) */}
              <td className="p-4">
                <div className="h-4 w-20 bg-slate-200/70 dark:bg-slate-800/70 rounded-md" />
              </td>

              {/* Col 3 (Status / Role) */}
              <td className="p-4">
                <div className="h-4 w-16 bg-slate-200/70 dark:bg-slate-800/70 rounded-full" />
              </td>

              {/* Col 4 (Engagement / Status) */}
              <td className="p-4">
                <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
              </td>

              {/* Col 5 (Date / Activity) */}
              {columns >= 5 && (
                <td className="p-4">
                  <div className="h-4 w-20 bg-slate-200/60 dark:bg-slate-800/60 rounded" />
                </td>
              )}

              {/* Col 6 (Actions) */}
              {columns >= 6 && (
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-2 justify-end">
                    <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-7 w-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

