import React from 'react';
import Link from 'next/link';
import { Coffee, ArrowLeft, BookOpen, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[65vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full glass-card p-8 sm:p-10 rounded-3xl border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Coffee className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">404</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Coffee Not Found</h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-sm mx-auto">
            The architectural publication, route, or developer document you are looking for has been brewed away or moved to a different endpoint.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/blogs"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-102"
          >
            <BookOpen className="w-4 h-4" /> Explore All Blogs
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-card text-white hover:bg-white/10 text-xs font-semibold border border-white/10 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
