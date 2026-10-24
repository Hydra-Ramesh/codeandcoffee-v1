import React from 'react';

interface BlogCardSkeletonProps {
  featured?: boolean;
}

export default function BlogCardSkeleton({ featured = false }: BlogCardSkeletonProps) {
  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden animate-pulse flex flex-col justify-between border border-white/5 ${
        featured ? 'md:grid md:grid-cols-12 md:gap-8 p-6 md:p-8' : 'p-5'
      }`}
    >
      {/* Banner placeholder */}
      <div
        className={`rounded-xl bg-slate-800/60 relative overflow-hidden ${
          featured ? 'md:col-span-7 h-64 md:h-80' : 'h-48 w-full mb-4'
        }`}
      >
        <div className="absolute top-3 left-3 w-20 h-5 rounded-full bg-slate-700/60" />
        <div className="absolute top-3 right-3 w-16 h-5 rounded-full bg-slate-700/60" />
      </div>

      {/* Content placeholder */}
      <div className={`flex flex-col flex-1 justify-between ${featured ? 'md:col-span-5' : ''}`}>
        <div className="space-y-3">
          {/* Metadata row */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-slate-800/80 rounded" />
            <div className="h-3 w-3 bg-slate-800/80 rounded-full" />
            <div className="h-3 w-20 bg-slate-800/80 rounded" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="h-5 bg-slate-800 rounded w-5/6" />
            <div className="h-5 bg-slate-800 rounded w-3/4" />
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 bg-slate-800/60 rounded w-full" />
            <div className="h-3.5 bg-slate-800/60 rounded w-11/12" />
            <div className="h-3.5 bg-slate-800/60 rounded w-4/6" />
          </div>

          {/* Read article link */}
          <div className="pt-2">
            <div className="h-3 w-24 bg-amber-500/20 rounded" />
          </div>
        </div>

        {/* Footer author & reactions */}
        <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-800" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3 bg-slate-800/80 rounded" />
            <div className="w-5 h-3 bg-slate-800/80 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
