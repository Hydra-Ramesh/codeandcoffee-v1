import React from 'react';
import { ArrowLeft, BookOpen, Layers, CheckCircle2, Clock, Award, ChevronDown } from 'lucide-react';

export default function CourseOverviewSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-10 animate-pulse select-none">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4 text-gray-500" />
        <div className="h-4 w-48 bg-slate-800 rounded-lg" />
      </div>

      {/* Hero Header Card Skeleton */}
      <div className="relative overflow-hidden rounded-3xl glass-card border border-white/10 p-6 sm:p-10 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-cyan-500/10 space-y-8">
        <div className="space-y-4 max-w-3xl">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-6 w-24 bg-amber-500/20 rounded-full border border-amber-500/30" />
            <div className="h-6 w-28 bg-purple-500/20 rounded-full border border-purple-500/30" />
            <div className="h-6 w-20 bg-slate-800 rounded-full border border-white/5" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <div className="h-10 sm:h-12 w-11/12 bg-slate-800 rounded-2xl" />
            <div className="h-10 sm:h-12 w-3/4 bg-slate-800 rounded-2xl" />
          </div>

          {/* Description */}
          <div className="space-y-2 pt-1 max-w-2xl">
            <div className="h-4 w-full bg-slate-800/70 rounded" />
            <div className="h-4 w-11/12 bg-slate-800/70 rounded" />
            <div className="h-4 w-4/5 bg-slate-800/70 rounded" />
          </div>
        </div>

        {/* Author & Primary CTA Row */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/10 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-40 bg-slate-800/60 rounded" />
            </div>
          </div>

          <div className="h-12 w-48 bg-amber-500/40 rounded-2xl border border-amber-500/40" />
        </div>

        {/* Progress Bar Skeleton */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-36 bg-slate-800/80 rounded" />
            <div className="h-3.5 w-12 bg-amber-500/30 rounded" />
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-500/50 h-full w-1/4 rounded-full" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          {[
            { icon: Layers, label: 'Modules' },
            { icon: BookOpen, label: 'Lessons' },
            { icon: Award, label: 'Quizzes' },
            { icon: Clock, label: 'Est. Time' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl glass-card border border-white/5 bg-slate-900/60 space-y-2">
              <div className="flex items-center gap-2 text-gray-500">
                <item.icon className="w-4 h-4 opacity-50" />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <div className="h-6 w-16 bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum Syllabus Modules Section Skeleton */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-7 w-56 bg-slate-800 rounded-xl" />
            <div className="h-3.5 w-72 bg-slate-800/60 rounded" />
          </div>
          <div className="h-8 w-28 bg-slate-800/60 rounded-xl" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((modIndex) => (
            <div key={modIndex} className="glass-card rounded-3xl border border-white/10 overflow-hidden bg-slate-900/40">
              {/* Module Header */}
              <div className="p-5 sm:p-6 flex items-center justify-between gap-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400/60 flex items-center justify-center font-bold text-xs shrink-0">
                    0{modIndex}
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-5 w-48 sm:w-64 bg-slate-800 rounded" />
                    <div className="h-3 w-36 bg-slate-800/60 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-24 bg-slate-800/80 rounded-full hidden sm:block" />
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </div>
              </div>

              {/* Subtopic Lessons List */}
              <div className="p-4 sm:p-6 space-y-2.5 bg-black/20">
                {[1, 2, 3].map((lessonIndex) => (
                  <div
                    key={lessonIndex}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 w-44 sm:w-60 bg-slate-800 rounded" />
                        <div className="h-3 w-32 bg-slate-800/50 rounded" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="h-5 w-16 bg-slate-800/70 rounded-full" />
                      <div className="h-5 w-20 bg-purple-500/15 rounded-full" />
                      <div className="h-8 w-24 bg-slate-800 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
