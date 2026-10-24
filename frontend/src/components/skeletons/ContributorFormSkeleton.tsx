import React from 'react';

export default function ContributorFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto" />
        <div className="h-8 w-72 bg-slate-800 rounded-xl mx-auto" />
        <div className="space-y-1.5 pt-1">
          <div className="h-3.5 w-96 max-w-full bg-slate-800/60 rounded mx-auto" />
          <div className="h-3.5 w-72 max-w-full bg-slate-800/60 rounded mx-auto" />
        </div>
      </div>

      {/* Form Card Skeleton */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <div className="h-3 w-28 bg-slate-800 rounded" />
          <div className="h-10 w-full bg-slate-800/50 rounded-xl" />
        </div>

        {/* Reason / Statement Field */}
        <div className="space-y-2">
          <div className="h-3 w-48 bg-slate-800 rounded" />
          <div className="h-28 w-full bg-slate-800/50 rounded-xl" />
        </div>

        {/* Resume Dropzone Field */}
        <div className="space-y-2">
          <div className="h-3 w-40 bg-slate-800 rounded" />
          <div className="h-24 w-full rounded-2xl border-2 border-dashed border-slate-700/60 bg-slate-900/40 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 rounded-lg bg-slate-800" />
            <div className="h-3 w-36 bg-slate-800/60 rounded" />
          </div>
        </div>

        {/* Submit Button */}
        <div className="h-11 w-full bg-slate-800 rounded-xl pt-2" />
      </div>
    </div>
  );
}
