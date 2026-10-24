'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Cpu,
  Layers,
  Cloud,
  Code2,
  Trophy,
  BrainCircuit,
  BookOpen,
  Zap,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Clock,
  Send,
  Loader2,
  FileCode,
  Rocket,
  Lock,
  LogIn,
  UserPlus,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function WhatsComingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activePillar, setActivePillar] = useState<'learn' | 'practice' | 'read' | 'apply'>('learn');
  const [selectedTrack, setSelectedTrack] = useState<string | null>('ai');
  const [interestTrack, setInterestTrack] = useState('All Tracks (Full Job-Ready Bundle)');
  const [notes, setNotes] = useState('');
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [userEntries, setUserEntries] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyWaitlistStatus();
    }
  }, [user]);

  const loadMyWaitlistStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetchApi('/waitlist/my-status');
      if (res.success && res.data) {
        setUserEntries(res.data.entries || []);
        if (res.data.hasJoined) {
          setWaitlistJoined(true);
        }
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Authentication Required: Please sign in or create an account to join the Early Access waiting list.');
      return;
    }

    setSubmittingWaitlist(true);
    try {
      const res = await fetchApi('/waitlist/join', {
        method: 'POST',
        body: JSON.stringify({
          track: interestTrack,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.success) {
        toast.success('🎉 Registered for Early Access! The admin panel has been notified and you are now on the VIP waiting list.');
        setWaitlistJoined(true);
        loadMyWaitlistStatus();
      } else {
        toast.error(res.message || 'Could not complete registration. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error occurred. Please try again.');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  const pillars = [
    {
      id: 'learn',
      title: 'Learn',
      subtitle: 'Conceptual Clarity & Deep Principles',
      icon: BookOpen,
      color: 'from-amber-500 to-amber-600',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      description:
        'Zero-fluff, production-grounded masterclasses and visual architecture diagrams created by senior engineers. Understand why distributed systems and algorithms work from first principles.',
      highlights: [
        'Interactive architectural blueprints with trade-off analysis',
        'Structured roadmaps from fundamental concepts to Staff Engineer depth',
        'Visual interactive simulations of distributed algorithms and consensus',
        'Curated problem-solving frameworks for technical interviews',
      ],
    },
    {
      id: 'practice',
      title: 'Practice',
      subtitle: 'Hands-on Code Sandboxes & Problem Sets',
      icon: Zap,
      color: 'from-cyan-500 to-blue-600',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      description:
        'Interactive in-browser code execution environments, rigorous algorithmic test-suites, and real-time system design drawing boards. Test your skills under real-time conditions.',
      highlights: [
        'Browser-based multi-language code playground with sub-millisecond execution',
        'Curated DSA pattern banks (Sliding Window, Two Pointers, DP, Graphs)',
        'Interactive System Design canvas: Draw nodes, queues, caches & calculate QPS',
        'Simulated competitive programming contests with automated ratings',
      ],
    },
    {
      id: 'read',
      title: 'Read',
      subtitle: 'Engineering Case Studies & Whitepapers',
      icon: FileCode,
      color: 'from-purple-500 to-indigo-600',
      badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      description:
        'Deep-dive technical journals, production outage post-mortems, and whitepaper breakdowns. Learn how high-traffic platforms like Netflix, Uber, and Stripe architect their backends.',
      highlights: [
        'Dissect real production failures, database deadlocks, and network partitions',
        'Database internals: B-Trees, LSM-Trees, WAL logs, and Postgres MVCC',
        'Clean code and design pattern walkthroughs in modern TypeScript, Go & Rust',
        'Exclusive author community reviews and high-caffeine technical discussions',
      ],
    },
    {
      id: 'apply',
      title: 'Apply',
      subtitle: 'Resume-Grade Projects & Job-Readiness',
      icon: Briefcase,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      description:
        'Transform theoretical knowledge into verifiable, production-ready portfolio artifacts. Build and deploy distributed microservices and autonomous AI agents that make your resume stand out.',
      highlights: [
        'Build production distributed systems: Custom Redis cache, Mini-Kafka queue, or RAG engine',
        'Code reviews and architecture critiques from experienced developers',
        'Job-readiness checklists and direct hiring partner referrals',
        'Published case studies directly on the Code & Coffee Author Guild',
      ],
    },
  ];

  const tracks = [
    {
      id: 'ai',
      title: 'Exploring AI & LLM Systems',
      subtitle: 'Generative AI, Agents & Vector Intelligence',
      badge: 'High Demand',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      icon: BrainCircuit,
      iconColor: 'text-purple-400',
      gradient: 'from-purple-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-purple-500/30 hover:border-purple-500/60',
      summary:
        'Move beyond basic API calls. Master the end-to-end architecture of modern Generative AI, Retrieval-Augmented Generation (RAG), and Autonomous Multi-Agent Workflows.',
      topics: [
        'RAG Architectures with pgvector, Pinecone & Hybrid Sparse-Dense Search',
        'Autonomous AI Agents with dynamic Tool Calling & Reasoning Loops',
        'Local LLM inference optimization, quantization & vLLM deployment',
        'Context window management, chunking heuristics & prompt resilience',
        'Evaluating AI hallucination with automated evaluation metrics',
      ],
    },
    {
      id: 'dsa',
      title: 'DSA & Algorithmic Mastery',
      subtitle: 'Pattern-Based Problem Solving for Interviews',
      badge: 'Core Fundamentals',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      icon: Layers,
      iconColor: 'text-amber-400',
      gradient: 'from-amber-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-amber-500/30 hover:border-amber-500/60',
      summary:
        'Stop grinding random problems. Learn the 16 core algorithmic patterns that solve 95% of technical interview questions at top engineering firms.',
      topics: [
        'Sliding Window, Two Pointers, Monotonic Stacks & Queues',
        'Graph Traversal: BFS, DFS, Dijkstra, Topo-Sort & Union-Find',
        'Dynamic Programming: Memoization vs Tabulation & 2D State Transitions',
        'Trees, Tries, Heaps, and Segment Tree range queries',
        'Time & Space Complexity analysis with mathematical rigor',
      ],
    },
    {
      id: 'system-design',
      title: 'High-Scale System Design',
      subtitle: 'HLD Distributed Systems & LLD Architecture',
      badge: 'Staff Engineer Track',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      icon: Cpu,
      iconColor: 'text-cyan-400',
      gradient: 'from-cyan-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-cyan-500/30 hover:border-cyan-500/60',
      summary:
        'Architect systems that scale to millions of concurrent requests. Master both High-Level Design (HLD) and Low-Level Object-Oriented Design (LLD).',
      topics: [
        'Distributed Caching strategies: Redis caching patterns, cache-aside & invalidation',
        'Message Queues & Event Streaming: Kafka partitioning & idempotency',
        'Database Sharding, Replication, Consistency Models & CAP Theorem',
        'Rate Limiting algorithms (Token Bucket, Leaky Bucket, Sliding Window)',
        'Object-Oriented Design Patterns, SOLID Principles & Clean Architecture in practice',
      ],
    },
    {
      id: 'devops',
      title: 'DevOps, Cloud & SRE',
      subtitle: 'Kubernetes, CI/CD, Terraform & Observability',
      badge: 'Production Ready',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: Cloud,
      iconColor: 'text-emerald-400',
      gradient: 'from-emerald-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      summary:
        'Zero downtime deployments. Master container orchestration, automated delivery pipelines, Infrastructure as Code, and real-time observability.',
      topics: [
        'Docker container multi-stage build optimization and security scanning',
        'Kubernetes pod scheduling, ingress controllers, HPA, and Helm charts',
        'CI/CD workflows with GitHub Actions, canary releases, and blue/green deploys',
        'Terraform modular infrastructure provisioning on AWS / GCP',
        'Prometheus metrics, Grafana dashboards, and distributed tracing with OpenTelemetry',
      ],
    },
    {
      id: 'coding',
      title: 'Modern Coding & Fullstack Systems',
      subtitle: 'Clean Code, Modern TS/Node/Go & High-Performance UI',
      badge: 'Daily Craftsmanship',
      badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      icon: Code2,
      iconColor: 'text-blue-400',
      gradient: 'from-blue-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-blue-500/30 hover:border-blue-500/60',
      summary:
        'Write expressive, testable, and maintainable code. Master concurrent backends in Go and Node.js, reactive state architectures, and sub-100ms UI rendering.',
      topics: [
        'Modern TypeScript strict type modeling, generics & utility types',
        'High-performance backend concurrency with Go routines and channels',
        'Database query tuning, Prisma indexes, and transaction isolation levels',
        'Next.js Server Actions, streaming SSR, and edge compute performance',
        'Comprehensive unit, integration, and E2E testing strategies with Vitest & Playwright',
      ],
    },
    {
      id: 'cp',
      title: 'Competitive Programming',
      subtitle: 'Speed, Mathematical Depth & Contest Excellence',
      badge: 'Hardcore Problem Solving',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: Trophy,
      iconColor: 'text-rose-400',
      gradient: 'from-rose-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-rose-500/30 hover:border-rose-500/60',
      summary:
        'Push algorithmic reflexes to the absolute edge. Master mathematical thinking, bit manipulation, number theory, and speed coding for global programming contests.',
      topics: [
        'Number Theory: Modular arithmetic, Euclidean GCD, Sieve of Eratosthenes',
        'Bitwise tricks, Fast I/O, and constant-factor optimization in C++',
        'Advanced Range Queries: Fenwick Trees, Segment Trees with Lazy Propagation',
        'Game Theory: Nim games, Sprague-Grundy Theorem & minimax pruning',
        'Contest strategy: Time allocation, stress-testing scripts & corner case isolation',
      ],
    },
  ];

  const milestones = [
    {
      quarter: 'Phase 1 • Live Now',
      title: 'Technical Publishing Journal',
      description: 'In-depth architecture articles, reader engagement, active reader telemetries, and community feedback.',
      status: 'Live & Operational',
      statusColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      isCurrent: true,
    },
    {
      quarter: 'Phase 2 • Q4 2026',
      title: 'Interactive Code Playground & DSA Tracks',
      description: 'In-browser multi-language execution sandbox with curated algorithmic patterns and test suites.',
      status: 'In Active Development',
      statusColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      isCurrent: false,
    },
    {
      quarter: 'Phase 3 • Q1 2027',
      title: 'System Design Canvas & AI Agent Labs',
      description: 'Visual drag-and-drop system design architecture board with live QPS calculator and autonomous LLM agent builder.',
      status: 'Prototyped',
      statusColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      isCurrent: false,
    },
    {
      quarter: 'Phase 4 • Q2 2027',
      title: 'Competitive Arena & Job-Ready Capstones',
      description: 'Simulated rating contests, resume-grade project evaluations, and direct hiring partner referrals.',
      status: 'Roadmap Milestone',
      statusColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      isCurrent: false,
    },
  ];

  const activePillarData = pillars.find((p) => p.id === activePillar) || pillars[0];
  const selectedTrackData = tracks.find((t) => t.id === selectedTrack) || tracks[0];

  return (
    <div className="space-y-16 py-6 max-w-6xl mx-auto">
      {/* HERO SECTION */}
      <div className="text-center space-y-6 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/10 animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Platform Evolution • What&apos;s Coming</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          We are Building the Ultimate{' '}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
            Job-Ready Engineering
          </span>{' '}
          Ecosystem
        </h1>

        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          From foundational concepts to Staff-level execution. We provide deep exposure across{' '}
          <strong className="text-amber-400 font-semibold">AI &amp; LLMs</strong>,{' '}
          <strong className="text-amber-400 font-semibold">DSA Mastery</strong>,{' '}
          <strong className="text-amber-400 font-semibold">High-Scale System Design</strong>,{' '}
          <strong className="text-amber-400 font-semibold">DevOps &amp; Cloud</strong>, and{' '}
          <strong className="text-amber-400 font-semibold">Competitive Programming</strong>.
        </p>

        {/* AUTHENTICATION STATUS BANNER */}
        {!authLoading && !user && (
          <div className="max-w-2xl mx-auto mt-6 p-6 rounded-2xl glass-card border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/5 text-left space-y-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Authentication Required</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                    Member Access
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Please sign in or create an account to view curriculum breakdowns and join the early access waiting list.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <Link
                href="/auth/login?redirect=/whats-coming"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Unlock &amp; Join Waitlist</span>
              </Link>
              <Link
                href="/auth/register?redirect=/whats-coming"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Free Account</span>
              </Link>
            </div>
          </div>
        )}

        {user && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Authenticated as <strong>{user.name}</strong> ({user.email})</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#pillars"
            className="px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 hover:bg-amber-400 transition-all flex items-center gap-2"
          >
            <span>Explore 4 Pillars</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#waitlist"
            className="px-6 py-3 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-sm border border-white/10 transition-all flex items-center gap-2"
          >
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>VIP Early Access Waiting List</span>
          </a>
        </div>
      </div>

      {/* 4 PILLARS FRAMEWORK */}
      <div id="pillars" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Our 4-Pillar Mastery Framework
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Learn • Practice • Read • Apply
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            A comprehensive, one-stop pedagogical pipeline crafted so you never get stuck between theory and real-world execution.
          </p>
        </div>

        {/* Pillar Switcher Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = activePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(pillar.id as any)}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer ${
                  isActive
                    ? 'glass-card border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'glass-card border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{pillar.title}</div>
                  <div className="text-[11px] text-gray-400">{pillar.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-10 border border-white/10 space-y-6 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-black/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="space-y-1">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${activePillarData.badgeBg}`}>
                Pillar: {activePillarData.title}
              </span>
              <h3 className="text-2xl font-extrabold text-white">{activePillarData.subtitle}</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-md leading-relaxed">
              {activePillarData.description}
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              Key Capabilities &amp; Features:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePillarData.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3 text-xs sm:text-sm text-gray-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 6 CORE CURRICULUM TRACKS */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Engineered For Modern High-Scale Careers
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            6 Specialized Technical Tracks
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Deep dive into any track or master all six to become an indisputable 10x Fullstack &amp; Systems Engineer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => {
            const Icon = track.icon;
            const isSelected = selectedTrack === track.id;
            return (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? `glass-card ${track.borderColor} shadow-xl shadow-amber-500/10 bg-gradient-to-b ${track.gradient}`
                    : 'glass-card border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-white/5 ${track.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${track.badgeColor}`}>
                      {track.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{track.title}</h3>
                    <p className="text-xs text-gray-400">{track.subtitle}</p>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {track.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>{isSelected ? 'Viewing Detailed Topics' : 'Click to View Curriculum'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Track Detailed Topic Breakdown */}
        {selectedTrackData && (
          <div className="p-6 sm:p-8 rounded-3xl glass-card border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-slate-900 to-black/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-white/5 ${selectedTrackData.iconColor}`}>
                  <selectedTrackData.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTrackData.title}</h3>
                  <p className="text-xs text-gray-400">{selectedTrackData.subtitle}</p>
                </div>
              </div>
              <span className={`self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold border ${selectedTrackData.badgeColor}`}>
                {selectedTrackData.badge}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                Curriculum Breakdown &amp; Exposure Topics:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTrackData.topics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2.5 text-xs text-gray-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ROADMAP TIMELINE */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Transparent Development Roadmap
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Release Schedule &amp; Milestones
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Our iterative roadmap towards delivering the complete job-ready platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                m.isCurrent
                  ? 'glass-card border-emerald-500/40 bg-emerald-950/10 shadow-lg shadow-emerald-950/20'
                  : 'glass-card border-white/10'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-gray-400">{m.quarter}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${m.statusColor}`}>
                    {m.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{m.title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{m.description}</p>
              </div>

              {m.isCurrent && (
                <div className="pt-2">
                  <Link
                    href="/blogs"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:underline"
                  >
                    <span>Explore Current Journal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* VIP EARLY ACCESS WAITLIST SECTION */}
      <div id="waitlist" className="scroll-mt-24">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 glass-card bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-purple-950/20 p-8 sm:p-12">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 inline-flex">
              <Rocket className="w-6 h-6" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Get VIP Early Access to the Platform
            </h2>

            <p className="text-sm text-gray-300 leading-relaxed">
              We are opening closed beta cohorts for dedicated developers. Request early access notification to be prioritized on the administrator waiting list, receive private sandbox credentials, and get invited directly.
            </p>

            {/* UNREGISTERED / GUEST VISITOR LOCK */}
            {!authLoading && !user ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-amber-500/30 text-center space-y-4 mt-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Sign In Required to Request Early Access</h3>
                  <p className="text-xs text-gray-300 max-w-md mx-auto">
                    To prevent duplicate bots and ensure direct communication with real builders, early access requests are reserved for authenticated members.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/auth/login?redirect=/whats-coming#waitlist"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Request Early Access</span>
                  </Link>
                  <Link
                    href="/auth/register?redirect=/whats-coming#waitlist"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register New Account</span>
                  </Link>
                </div>
              </div>
            ) : waitlistJoined && userEntries.length > 0 ? (
              /* ALREADY ON WAITLIST */
              <div className="p-6 sm:p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 animate-fade-in mt-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">You Are on the VIP Early Access Waiting List!</h3>
                  <p className="text-xs text-emerald-200">
                    The administrator panel has recorded your request. When early access cohort slots open, an invite email will be dispatched to <strong>{user?.email}</strong>.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-left">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Your Registered Cohort Tracks:
                  </div>
                  {userEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white">{entry.track}</span>
                        {entry.notes && (
                          <p className="text-[11px] text-gray-400 italic">&ldquo;{entry.notes}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          STATUS: {entry.status}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setWaitlistJoined(false)}
                    className="text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    + Register for another track or submit additional notes
                  </button>
                </div>
              </div>
            ) : (
              /* AUTHENTICATED WAITLIST SUBMISSION FORM */
              <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Developer Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-gray-300 bg-white/5 cursor-not-allowed opacity-80"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Verified Email</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-gray-300 bg-white/5 cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Select Your Desired Early Access Track
                  </label>
                  <select
                    value={interestTrack}
                    onChange={(e) => setInterestTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900 border border-white/10"
                  >
                    <option value="All Tracks (Full Job-Ready Bundle)">All Tracks (Full Job-Ready Bundle)</option>
                    <option value="Exploring AI & LLM Systems">Exploring AI &amp; LLM Systems</option>
                    <option value="DSA & Algorithmic Problem Solving">DSA &amp; Algorithmic Mastery</option>
                    <option value="High-Scale System Design">High-Scale System Design (HLD &amp; LLD)</option>
                    <option value="DevOps, Cloud & SRE">DevOps, Cloud &amp; SRE</option>
                    <option value="Modern Coding & Fullstack Systems">Modern Coding &amp; Fullstack Systems</option>
                    <option value="Competitive Programming">Competitive Programming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    What would you most like to learn or build? (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Currently preparing for SDE-2 interviews, excited for AI agents and distributed caching modules..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white placeholder-gray-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingWaitlist}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                >
                  {submittingWaitlist ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting Request to Admin Panel...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Request Early Access Notification</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-gray-500 text-center">
                  Protected by Code &amp; Coffee security. We will only notify you when your requested early access cohort is ready.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
