import React from 'react';
import { BookOpen, Search, GraduationCap } from 'lucide-react';

export default function ReadCatalogSkeleton() {
  return (
    <div className="space-y-8 pb-16 animate-pulse select-none">
      {/* Sleek Header Skeleton */}
      <section className="relative pt-2 pb-2">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5 text-amber-400 opacity-70" />
                <div className="h-2.5 w-32 bg-amber-500/30 rounded" />
              </div>

              <div className="h-8 sm:h-9 w-72 sm:w-96 bg-slate-800 rounded-xl" />
              <div className="h-3.5 w-80 sm:w-112 bg-slate-800/60 rounded" />
            </div>

            <div className="hidden lg:flex flex-col gap-1.5 shrink-0">
              <div className="h-3 w-48 bg-slate-800/60 rounded" />
              <div className="h-3 w-40 bg-slate-800/60 rounded" />
            </div>
          </div>

          {/* Unified Filter & Search Toolbar Skeleton */}
          <div className="glass-card p-2 sm:p-2.5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60">
            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              {[1, 2, 3, 4, 5].map((cat) => (
                <div key={cat} className="h-7 w-24 rounded-xl bg-slate-800/80 shrink-0" />
              ))}
            </div>

            {/* Search Input Mockup */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1 md:w-64 h-8 rounded-xl bg-slate-950/80 border border-white/10 flex items-center px-3 gap-2">
                <Search className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <div className="h-3 w-36 bg-slate-800/60 rounded" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-amber-400 opacity-60" />
          <div className="h-4 w-36 bg-slate-800 rounded" />
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-6 bg-slate-900/40"
            >
              <div className="space-y-4">
                <div className="relative w-full h-40 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 border border-white/10 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 bg-amber-500/20 rounded-full border border-amber-500/30" />
                    <div className="h-5 w-16 bg-slate-800/90 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10" />
                    <div className="h-3.5 w-24 bg-slate-800 rounded" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-5 w-11/12 bg-slate-800 rounded-lg" />
                  <div className="h-5 w-2/3 bg-slate-800/80 rounded-lg" />
                </div>

                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-slate-800/60 rounded" />
                  <div className="h-3 w-4/5 bg-slate-800/60 rounded" />
                </div>

                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-3 gap-2">
                  <div className="h-5 bg-slate-800/70 rounded" />
                  <div className="h-5 bg-slate-800/70 rounded" />
                  <div className="h-5 bg-slate-800/70 rounded" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10" />
                  <div className="h-3 w-20 bg-slate-800/70 rounded" />
                </div>
                <div className="h-8 w-24 bg-amber-500/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
