import React from 'react';
import { Coffee } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 py-20">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Coffee className="w-7 h-7 animate-pulse" />
        </div>
        <span className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-md -z-10 animate-ping" />
      </div>
      <p className="text-xs font-mono text-gray-400 tracking-wider uppercase animate-pulse">
        Brewing Architecture Content...
      </p>
    </div>
  );
}
