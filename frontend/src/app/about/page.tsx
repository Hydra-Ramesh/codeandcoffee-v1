'use client';

import React from 'react';
import Link from 'next/link';
import {
  Coffee,
  GraduationCap,
  Brain,
  Users,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Zap,
  Terminal,
  Award,
  ArrowRight,
  Mail,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { label: 'Students Trained & Mentored', value: '2,000+', desc: 'Equipped with job-ready fullstack & system design skills' },
    { label: 'Teaching & Mentorship', value: '3+ Years', desc: 'Active engineering coaching and technical curriculum design' },
    { label: 'Academic Pedigree', value: 'IIT Guwahati', desc: 'Rigorous engineering foundations from India’s top tier institute' },
    { label: 'Industry Exposure', value: 'MNC Veteran', desc: 'Built resilient architectures across enterprise ecosystems' },
  ];

  const pillars = [
    {
      icon: <Brain className="w-5 h-5 text-amber-400" />,
      title: 'AI Era Engineering',
      description:
        'With generative AI transforming the workplace, mastering fundamental architectures, data models, and prompt-driven systems is what differentiates elite builders from replaceable script-runners.',
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-400" />,
      title: 'Production Scale & Rigor',
      description:
        'Beyond simple CRUD apps: understanding cache stampedes, distributed consensus, sub-millisecond telemetry, and asynchronous worker queues under heavy concurrency.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: 'Zero-Trust Security',
      description:
        'Embedding cryptographic token handshakes, role-based access control, secure OAuth protocols, and automated sanitization into every software layer from day zero.',
    },
    {
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      title: 'Empowering Next-Gen Talent',
      description:
        'Democratizing real-world exposure so students and transitioning developers can confidently crack high-impact engineering roles at premier product companies.',
    },
  ];

  const stack = [
    { name: 'Distributed Relational Store', role: 'High-availability relational persistence, transactional safety, and index optimization' },
    { name: 'In-Memory Caching & Telemetry', role: 'Sliding window rate limiters and real-time active reader pulse telemetry' },
    { name: 'Hardened Zero-Trust API Gateway', role: 'Strict REST v1 contracts, JWT authentication, and automated request validation' },
    { name: 'Cloudinary CDN Edge Storage', role: 'Global media delivery, automated WebP/AVIF formatting, and responsive asset streaming' },
    { name: 'Asynchronous Event Workers', role: 'Resilient Redis & BullMQ queues for subscriber broadcasts and transactional emails' },
    { name: 'Next.js 16 Responsive Frontend', role: 'Fluid container queries, Markdown parsing with syntax highlighting, and glassmorphism' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Mind Behind Code &amp; Coffee</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Where Code, Scale &amp; <span className="gradient-text-amber">AI Research Converge.</span>
        </h1>
        <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Founded with a clear conviction: in the age of artificial intelligence, mastering deep systems,
          uncompromising security, and real scale is the only path to career mastery.
        </p>
      </div>

      {/* Founder Story Feature Card */}
      <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl space-y-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar / Badge */}
          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 via-purple-600 to-indigo-600 p-1 shadow-xl">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center text-3xl font-extrabold text-amber-400 font-mono">
                RD
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold shadow-lg" title="Active Educator & Researcher">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Ramesh Das</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                AI Researcher
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                IIT Guwahati
              </span>
            </div>
            <p className="text-sm text-gray-300 font-medium">
              Founder &amp; Lead Systems Architect • Ex-MNC Software Engineer • Engineering Educator
            </p>
          </div>
        </div>

        {/* Narrative */}
        <div className="space-y-4 text-gray-300 text-sm sm:text-base leading-relaxed relative z-10 border-t border-white/10 pt-6">
          <p>
            Hello! I am <strong className="text-white">Ramesh Das</strong>. Over the past <strong className="text-amber-400">3+ years</strong> of dedicated technical teaching, I have had the privilege of mentoring and training over <strong className="text-amber-400">2,000+ students to become industry job-ready engineers</strong>—a mission I passionately continue every single day.
          </p>
          <p>
            In this rapid <strong className="text-white">Era of Artificial Intelligence</strong>, the tech landscape has fundamentally transformed. We all know how critical <strong className="text-purple-300">system scaling, bulletproof security, and diverse technological exposure</strong> have become. In today’s competitive market, cracking top engineering roles without hands-on exposure to modern architecture is almost impossible. Surface-level syntax is no longer enough; companies demand engineers who understand how distributed data flows, how caching prevents bottlenecks, and how to build resilient systems.
          </p>
          <p>
            After graduating from <strong className="text-white">IIT Guwahati</strong> and working with top global <strong className="text-white">MNCs</strong> on enterprise systems, I founded <strong className="text-amber-400">Code &amp; Coffee</strong> to give back. Currently an active <strong className="text-purple-300">AI Researcher</strong>, I am here to serve students, aspiring developers, and seasoned builders with the practical, production-level exposure needed to lead the future of computing.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 relative z-10">
          {stats.map((s) => (
            <div key={s.label} className="p-4 rounded-2xl glass-card border border-white/5 space-y-1">
              <div className="text-xl sm:text-2xl font-black text-amber-400">{s.value}</div>
              <div className="text-xs font-bold text-white">{s.label}</div>
              <div className="text-[11px] text-gray-400 leading-tight">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Philosophy Pillars */}
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2.5">
            <Award className="w-6 h-6 text-amber-400" />
            Our Mission &amp; Engineering Pillars
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            The core tenets driving every publication and educational roadmap on Code &amp; Coffee.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map((p) => (
            <div key={p.title} className="glass-card p-6 rounded-2xl border border-white/10 space-y-2.5 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                {p.icon}
                {p.title}
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Production Stack Showcase */}
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2.5">
            <Terminal className="w-6 h-6 text-cyan-400" />
            Platform Architecture Blueprint
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Built from scratch to serve as a live, open-architecture reference implementation for readers.
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

      {/* Call to Action Card */}
      <div className="p-8 sm:p-10 rounded-3xl glass-card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent text-center space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Join Our Growing Developer Community</h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto">
            Ready to dive into real-world system architecture, database performance, and AI-accelerated engineering?
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/blogs"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Explore Technical Publications
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-colors flex items-center gap-2"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            Contact &amp; Mentorship
          </Link>
        </div>
      </div>
    </div>
  );
}

