import React from 'react';

export default function PracticeQuestionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 2 Accordion Topic Groups */}
      {[1, 2].map((group) => (
        <div
          key={group}
          className="glass-card rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Group Header */}
          <div className="px-5 py-4 flex items-center justify-between bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800/80" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-slate-800 rounded-md" />
                <div className="h-2.5 w-20 bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-16 bg-slate-800/60 rounded" />
              <div className="w-4 h-4 bg-slate-800 rounded" />
            </div>
          </div>

          {/* Question Rows inside Accordion */}
          <div className="divide-y divide-white/5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Checkmark + Question details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-4 w-48 sm:w-64 bg-slate-800 rounded" />
                      <div className="h-4 w-14 bg-slate-800/70 rounded-full" />
                      <div className="h-4 w-16 bg-slate-800/60 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-28 bg-slate-800/50 rounded" />
                      <div className="h-2.5 w-20 bg-slate-800/50 rounded" />
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  <div className="h-8 w-20 bg-slate-800/70 rounded-xl" />
                  <div className="h-8 w-16 bg-slate-800/70 rounded-xl" />
                  <div className="h-8 w-16 bg-slate-800/50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
