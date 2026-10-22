import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 text-gray-300">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" /> Technical Disclaimer
        </div>
        <h1 className="text-3xl font-extrabold text-white">Disclaimer</h1>
        <p className="text-xs text-gray-400">
          Published: October 2026 • Code &amp; Coffee Media Inc.
        </p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">1. Technical Advice &amp; Architectural Representations</h2>
        <p>
          The architectural patterns, database benchmarks, and code snippets published on Code &amp; Coffee are provided
          &quot;as is&quot; for informational and educational purposes. While our engineering team rigorously tests all implementations,
          distributed systems behavior varies substantially depending on workload characteristics, network topology, and infrastructure configuration.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">2. Third-Party Trademarks &amp; References</h2>
        <p>
          PostgreSQL, Neon, Redis, Upstash, Next.js, Node.js, and other referenced technologies are registered trademarks of their
          respective owners. Code &amp; Coffee is an independent technical journal and is not formally endorsed or sponsored
          unless explicitly stated.
        </p>
      </section>
    </div>
  );
}
