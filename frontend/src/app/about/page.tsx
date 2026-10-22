'use client';

import React from 'react';
import { Coffee, Shield, Zap, Database, Terminal, Heart, Sparkles, Award } from 'lucide-react';

export default function AboutPage() {
  const stack = [
    { name: 'Neon Serverless PostgreSQL', role: 'Primary durable relational storage with instant branching & connection pooling' },
    { name: 'Upstash Distributed Redis', role: 'Sub-millisecond sliding window rate limiting & real-time reader heartbeats' },
    { name: 'Node.js & Express v1 REST API', role: 'Hardened zero-trust gateway with Helmet, CORS, and Zod schema validations' },
    { name: 'Next.js 15 App Router', role: 'Modern React server components, fluid responsive container queries, and glassmorphism UI' },
    { name: 'BullMQ & Nodemailer', role: 'Asynchronous background queues for transactional Google SMTP email delivery' },
    { name: 'MongoDB Atlas', role: 'Flexible document store for blog revision histories and rich draft archival' },
  ];

  const team = [
    {
      name: 'Elena Rostova',
      role: 'Founder & Principal Distributed Systems Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Ex-Staff Engineer specializing in high-throughput event queues, database internals, and single-origin Ethiopian espresso.',
    },
    {
      name: 'Marcus Vance',
      role: 'Head of Security & Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      bio: 'Zero-trust advocate, cryptographic protocol designer, and cloud security researcher with a passion for pour-over chemex.',
    },
    {
      name: 'Aria Takahashi',
      role: 'Lead Frontend Experience Engineer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      bio: 'Web Standards obsessive crafting accessible design tokens, micro-animations, and fluid viewport typography.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Coffee className="w-8 h-8" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Where Code &amp; <span className="gradient-text-hero">Caffeine Converge.</span>
        </h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
          We founded Code &amp; Coffee with a singular conviction: engineering content should be rigorous,
          uncompromising, and deeply grounded in production reality.
        </p>
      </div>

      {/* Mission Section */}
      <div className="glass-card p-8 sm:p-10 rounded-3xl border border-white/10 space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400" />
          The Code &amp; Coffee Philosophy
        </h2>
        <p className="text-gray-300 leading-relaxed">
          Modern software engineering moves at blistering speed. Too often, developers are left navigating
          surface-level tutorials that ignore the operational complexities of production: connection pool starvation,
          thundering-herd cache stampedes, cryptographic entropy flaws, and distributed race conditions.
        </p>
        <p className="text-gray-300 leading-relaxed">
          Every publication on Code &amp; Coffee is curated by technical architects and battle-tested practitioners.
          Only verified administrators author articles, ensuring that the engineering journal remains free of spam,
          promotional fluff, and automated noise.
        </p>
      </div>

      {/* Production Stack Showcase */}
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2.5">
            <Terminal className="w-6 h-6 text-cyan-400" />
            The Platform Production Stack
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Built from scratch to demonstrate best-in-class fullstack architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stack.map((item) => (
            <div key={item.name} className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {item.name}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">{item.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center sm:text-left flex items-center justify-center sm:justify-start gap-2.5">
          <Award className="w-6 h-6 text-purple-400" />
          The Editorial &amp; Architecture Board
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member.name} className="glass-card p-6 rounded-2xl border border-white/10 text-center space-y-3">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-20 h-20 rounded-full mx-auto border-2 border-amber-500/40 object-cover bg-slate-900"
              />
              <div>
                <h3 className="font-bold text-white text-sm">{member.name}</h3>
                <p className="text-[11px] text-amber-400 font-medium">{member.role}</p>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
