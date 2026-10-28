import React from 'react';
import { Coffee, ChevronLeft, ChevronDown, CheckCircle2, Lock, Play, Image as ImageIcon, Terminal, HelpCircle, Maximize2 } from 'lucide-react';

export default function ReadStudioSkeleton() {
  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 text-gray-100 overflow-hidden select-none animate-pulse">
      {/* Top Sticky App Header Skeleton */}
      <header className="h-14 shrink-0 bg-slate-950/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Sidebar Toggle Placeholder */}
          <div className="lg:hidden w-8 h-8 rounded-xl bg-slate-800/80 border border-white/10 shrink-0" />

          {/* Brand Logo Placeholder */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Coffee className="w-4 h-4 opacity-70" />
            </div>
            <div className="h-4 w-28 bg-slate-800 rounded hidden sm:block" />
          </div>

          <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />

          {/* Back to Course Syllabus Link */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 shrink-0">
            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            <div className="h-3 w-28 bg-slate-800 rounded" />
          </div>

          <div className="h-4 w-px bg-white/10 mx-1 hidden lg:block" />

          {/* Breadcrumb Module / Lesson Shimmer */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="h-3 w-24 bg-slate-800/60 rounded" />
            <span className="text-gray-600 text-xs">/</span>
            <div className="h-3 w-36 bg-slate-800/80 rounded" />
          </div>
        </div>

        {/* Right Header Badges & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quiz Status Badge */}
          <div className="h-7 w-28 bg-purple-500/10 border border-purple-500/20 rounded-full hidden sm:block" />

          {/* Fullscreen Toggle Placeholder */}
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-gray-500">
            <Maximize2 className="w-3.5 h-3.5 opacity-50" />
          </div>

          {/* User Avatar Placeholder */}
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
        </div>
      </header>

      {/* Main Studio Body Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Edge-to-Edge Syllabus Sidebar Skeleton */}
        <aside className="w-72 sm:w-80 border-r border-white/10 bg-slate-900/60 flex flex-col shrink-0 hidden lg:flex">
          {/* Course Title & Progress Bar Header */}
          <div className="p-4 border-b border-white/10 space-y-3 bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-amber-500/20 rounded-full" />
              <div className="h-3 w-8 bg-slate-800/80 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-11/12 bg-slate-800 rounded" />
              <div className="h-4 w-3/4 bg-slate-800/80 rounded" />
            </div>
            {/* Progress track */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500/50 h-full w-1/3 rounded-full" />
            </div>
          </div>

          {/* Topics & Lessons Accordion List */}
          <div className="p-3 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
            {/* Topic 1 - Active / Current Module */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  <div className="h-3.5 w-36 bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-12 bg-slate-800/80 rounded-full" />
              </div>

              {/* Subtopic Items */}
              <div className="pl-3 space-y-1.5 border-l border-white/10 ml-3">
                {/* Active Subtopic Item */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-amber-400 shrink-0 opacity-70" />
                    <div className="h-3.5 w-40 bg-slate-800 rounded" />
                  </div>
                  <div className="flex items-center gap-2 pl-5.5">
                    <div className="h-2.5 w-14 bg-slate-800/60 rounded" />
                    <div className="h-3 w-10 bg-amber-500/20 rounded-full" />
                  </div>
                </div>

                {/* Subtopic Item 2 (Completed) */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500/60 shrink-0" />
                    <div className="h-3 w-32 bg-slate-800/80 rounded" />
                  </div>
                  <div className="h-2.5 w-10 bg-slate-800/50 rounded" />
                </div>

                {/* Subtopic Item 3 (Locked) */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <div className="h-3 w-36 bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-2.5 w-8 bg-slate-800/40 rounded" />
                </div>

                {/* Subtopic Item 4 (Locked) */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <div className="h-3 w-28 bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-2.5 w-8 bg-slate-800/40 rounded" />
                </div>
              </div>
            </div>

            {/* Topic 2 - Next Module */}
            <div className="space-y-2 opacity-75">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                  <div className="h-3.5 w-40 bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-12 bg-slate-800/80 rounded-full" />
              </div>

              <div className="pl-3 space-y-1.5 border-l border-white/10 ml-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <div className="h-3 w-32 bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-2.5 w-10 bg-slate-800/40 rounded" />
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <div className="h-3 w-36 bg-slate-800/60 rounded" />
                  </div>
                  <div className="h-2.5 w-10 bg-slate-800/40 rounded" />
                </div>
              </div>
            </div>

            {/* Topic 3 - Advanced Module */}
            <div className="space-y-2 opacity-50">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
                  <div className="h-3.5 w-44 bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-12 bg-slate-800/80 rounded-full" />
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Reading Arena Skeleton */}
        <main className="flex-1 h-full overflow-y-auto px-4 sm:px-10 lg:px-16 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Breadcrumb Navigation Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-16 bg-slate-800/60 rounded" />
              <span className="text-gray-600 text-xs">/</span>
              <div className="h-3.5 w-36 bg-slate-800/60 rounded" />
              <span className="text-gray-600 text-xs">/</span>
              <div className="h-3.5 w-48 bg-slate-800/80 rounded" />
            </div>

            {/* Lesson Title & Badges Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-6 w-24 bg-amber-500/20 rounded-full border border-amber-500/30" />
                <div className="h-6 w-20 bg-slate-800/80 rounded-full border border-white/5" />
                <div className="h-6 w-28 bg-purple-500/20 rounded-full border border-purple-500/30" />
                <div className="h-6 w-32 bg-slate-800/70 rounded-full border border-white/5" />
              </div>

              <div className="space-y-2.5">
                <div className="h-10 sm:h-12 w-11/12 bg-slate-800 rounded-2xl" />
                <div className="h-10 sm:h-12 w-3/4 bg-slate-800 rounded-2xl" />
              </div>

              <div className="space-y-2 pt-1">
                <div className="h-4 w-full bg-slate-800/60 rounded" />
                <div className="h-4 w-4/5 bg-slate-800/60 rounded" />
              </div>
            </div>

            {/* Markdown Content Glass Card Skeleton */}
            <section className="glass-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-6">
              <div className="h-7 w-48 bg-slate-800 rounded-xl" />

              <div className="space-y-2.5">
                <div className="h-4 w-full bg-slate-800/70 rounded" />
                <div className="h-4 w-full bg-slate-800/70 rounded" />
                <div className="h-4 w-11/12 bg-slate-800/70 rounded" />
                <div className="h-4 w-4/5 bg-slate-800/70 rounded" />
              </div>

              {/* Realistic Code Block Preview Skeleton */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/90 shadow-2xl">
                <div className="bg-slate-900/90 px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 bg-amber-500/20 rounded border border-amber-500/30" />
                    <div className="h-3 w-32 bg-slate-800 rounded" />
                  </div>
                  <div className="h-6 w-16 bg-slate-800 rounded-lg" />
                </div>
                <div className="p-5 font-mono space-y-2.5 bg-slate-950">
                  <div className="h-3.5 w-1/3 bg-slate-800/90 rounded" />
                  <div className="h-3.5 w-1/2 bg-slate-800/70 rounded" />
                  <div className="h-3.5 w-2/3 bg-slate-800/80 rounded ml-6" />
                  <div className="h-3.5 w-3/5 bg-slate-800/80 rounded ml-6" />
                  <div className="h-3.5 w-1/4 bg-slate-800/70 rounded ml-6" />
                  <div className="h-3.5 w-1/6 bg-slate-800/90 rounded" />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="h-4 w-full bg-slate-800/70 rounded" />
                <div className="h-4 w-10/12 bg-slate-800/70 rounded" />
              </div>
            </section>

            {/* Architecture / Diagram Photo Card Skeleton */}
            <section className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400 opacity-60" />
                <div className="h-5 w-56 bg-slate-800 rounded-lg" />
              </div>

              {/* Simulated Media Frame */}
              <div className="h-56 sm:h-72 w-full rounded-2xl bg-slate-900/90 border border-white/5 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-gray-600">
                  <ImageIcon className="w-6 h-6 opacity-40" />
                </div>
                <div className="h-3 w-48 bg-slate-800/60 rounded" />
              </div>
              <div className="h-3 w-72 bg-slate-800/50 rounded" />
            </section>

            {/* "Let's Try" Interactive Coding Challenge Skeleton */}
            <section className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 bg-gradient-to-br from-slate-900/80 via-purple-950/20 to-slate-900/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                    <Terminal className="w-4 h-4 opacity-70" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-14 bg-green-500/20 rounded-full border border-green-500/30" />
                      <div className="h-5 w-48 bg-slate-800 rounded" />
                    </div>
                  </div>
                </div>
                <div className="h-8 w-36 bg-amber-500/20 rounded-xl border border-amber-500/30" />
              </div>

              <div className="space-y-2">
                <div className="h-3.5 w-full bg-slate-800/70 rounded" />
                <div className="h-3.5 w-4/5 bg-slate-800/70 rounded" />
              </div>

              {/* Editor Mockup */}
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950">
                <div className="h-9 bg-slate-900 px-4 flex items-center justify-between border-b border-white/5">
                  <div className="h-3 w-28 bg-slate-800 rounded" />
                  <div className="h-3 w-16 bg-slate-800/70 rounded" />
                </div>
                <div className="h-40 p-4 font-mono space-y-2">
                  <div className="h-3 w-1/2 bg-slate-800/80 rounded" />
                  <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
                  <div className="h-3 w-1/3 bg-slate-800/80 rounded" />
                </div>
              </div>
            </section>

            {/* Quiz & Verification Arena Skeleton */}
            <section className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/20 space-y-6 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400 opacity-60" />
                    <div className="h-5 w-48 bg-slate-800 rounded" />
                  </div>
                  <div className="h-3 w-64 bg-slate-800/60 rounded" />
                </div>
                <div className="h-6 w-32 bg-purple-500/20 rounded-full border border-purple-500/30" />
              </div>

              {/* Question 1 Block */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-slate-800/80 rounded" />
                  <div className="h-4 w-16 bg-amber-500/20 rounded-full" />
                </div>
                <div className="h-4 w-5/6 bg-slate-800 rounded" />

                {/* 4 Options */}
                <div className="space-y-2 pt-1">
                  {[1, 2, 3, 4].map((opt) => (
                    <div key={opt} className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 shrink-0" />
                      <div className="h-3.5 w-3/4 bg-slate-800/70 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Quiz Button Placeholder */}
              <div className="pt-2 flex justify-end">
                <div className="h-11 w-44 bg-amber-500/30 rounded-xl" />
              </div>
            </section>

            {/* Navigation Footer Skeleton */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="h-10 w-36 bg-slate-800/80 rounded-xl border border-white/5" />
              <div className="h-10 w-44 bg-amber-500/30 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
