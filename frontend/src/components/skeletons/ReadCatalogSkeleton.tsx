import React from 'react';
import { BookOpen, Search, GraduationCap } from 'lucide-react';

export default function ReadCatalogSkeleton() {
  return (
    <div className="space-y-12 pb-16 animate-pulse select-none">
      {/* Hero Section Skeleton */}
      <section className="relative pt-6 pb-10 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[300px] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

        <div className="max-w-3xl mx-auto space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-amber-400 opacity-70" />
            <div className="h-3 w-44 bg-amber-500/30 rounded" />
          </div>

          {/* Heading */}
          <div className="space-y-2.5">
            <div className="h-10 sm:h-14 w-10/12 sm:w-3/4 mx-auto bg-slate-800 rounded-2xl" />
            <div className="h-10 sm:h-14 w-8/12 sm:w-1/2 mx-auto bg-slate-800/80 rounded-2xl" />
          </div>

          {/* Subtitle */}
          <div className="space-y-2 max-w-2xl mx-auto pt-1">
            <div className="h-4 w-full bg-slate-800/60 rounded" />
            <div className="h-4 w-5/6 mx-auto bg-slate-800/60 rounded" />
          </div>

          {/* Search bar mockup */}
          <div className="relative max-w-xl mx-auto pt-2">
            <div className="h-13 w-full rounded-2xl bg-slate-900/80 border border-white/10 flex items-center px-4 gap-3">
              <Search className="w-5 h-5 text-gray-600 shrink-0" />
              <div className="h-4 w-64 bg-slate-800/70 rounded" />
            </div>
          </div>

          {/* Category Chips Skeleton */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((cat) => (
              <div key={cat} className="h-8 w-24 rounded-xl bg-slate-900/80 border border-white/10" />
            ))}
          </div>
        </div>
      </section>

      {/* Available Curriculums Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400 opacity-60" />
            <div className="h-6 w-48 bg-slate-800 rounded-lg" />
          </div>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="glass-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all bg-slate-900/40"
            >
              <div className="space-y-4">
                {/* Simulated Thumbnail / Banner Frame */}
                <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-950 border border-white/10 p-4 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 bg-amber-500/20 rounded-full border border-amber-500/30" />
                    <div className="h-5 w-16 bg-slate-800/90 rounded-full border border-white/5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10" />
                    <div className="h-4 w-28 bg-slate-800 rounded" />
                  </div>
                </div>

                {/* Course Title */}
                <div className="space-y-2">
                  <div className="h-5 w-11/12 bg-slate-800 rounded-lg" />
                  <div className="h-5 w-2/3 bg-slate-800/80 rounded-lg" />
                </div>

                {/* Course Description */}
                <div className="space-y-1.5">
                  <div className="h-3.5 w-full bg-slate-800/60 rounded" />
                  <div className="h-3.5 w-4/5 bg-slate-800/60 rounded" />
                </div>

                {/* Metrics Pill Box */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div className="space-y-1">
                    <div className="h-4 w-8 bg-slate-800 rounded mx-auto" />
                    <div className="h-2.5 w-12 bg-slate-800/60 rounded mx-auto" />
                  </div>
                  <div className="space-y-1 border-x border-white/10">
                    <div className="h-4 w-8 bg-slate-800 rounded mx-auto" />
                    <div className="h-2.5 w-12 bg-slate-800/60 rounded mx-auto" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 w-8 bg-slate-800 rounded mx-auto" />
                    <div className="h-2.5 w-12 bg-slate-800/60 rounded mx-auto" />
                  </div>
                </div>
              </div>

              {/* Footer Row */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
                  <div className="h-3 w-20 bg-slate-800/70 rounded" />
                </div>

                <div className="h-9 w-28 bg-amber-500/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
