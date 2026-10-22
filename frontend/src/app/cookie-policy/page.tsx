import React from 'react';
import { Cookie } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 text-gray-300">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Cookie className="w-4 h-4" /> Telemetry &amp; Storage
        </div>
        <h1 className="text-3xl font-extrabold text-white">Cookie &amp; Storage Policy</h1>
        <p className="text-xs text-gray-400">
          Last Updated: October 2026 • Code &amp; Coffee Platform Standards
        </p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">1. How We Use Cookies &amp; Local Storage</h2>
        <p>
          We utilize minimal browser storage tokens solely to maintain secure authentication state, verify active sessions,
          and render real-time reader telemetry. We do not sell user data to advertising networks.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">2. Storage Classifications</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl glass-card border border-white/10">
            <h3 className="font-bold text-amber-400 text-sm">Essential Authentication Token (localStorage)</h3>
            <p className="text-xs text-gray-400 mt-1">
              Encrypted JSON Web Token (JWT) identifying your authenticated session. Cleared immediately upon signing out.
            </p>
          </div>

          <div className="p-4 rounded-xl glass-card border border-white/10">
            <h3 className="font-bold text-emerald-400 text-sm">Active Reader Telemetry (sessionStorage)</h3>
            <p className="text-xs text-gray-400 mt-1">
              Anonymous transient identifier used by Redis heartbeat pings to compute live readers per article. Automatically destroyed when browser tabs are closed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
