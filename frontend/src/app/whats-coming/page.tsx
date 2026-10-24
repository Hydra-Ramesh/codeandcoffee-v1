'use client';

import React, { useState } from 'react';
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
  Compass,
  Coffee,
  Check,
  Send,
  Loader2,
  Users,
  Target,
  FileCode,
  ShieldCheck,
  Rocket,
  ChevronRight,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function WhatsComingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activePillar, setActivePillar] = useState<'learn' | 'practice' | 'read' | 'apply'>('learn');
  const [selectedTrack, setSelectedTrack] = useState<string | null>('ai');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [interestTrack, setInterestTrack] = useState('All Tracks (Full Job-Ready Bundle)');
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);

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
        'Rate limiters, Load balancers, API gateways & consistent hashing',
        'LLD: SOLID principles, Factory, Strategy, Observer & Decorator patterns',
      ],
    },
    {
      id: 'devops',
      title: 'DevOps, Cloud & SRE',
      subtitle: 'Containerization, CI/CD & Production Reliability',
      badge: 'Production Reliability',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      icon: Cloud,
      iconColor: 'text-emerald-400',
      gradient: 'from-emerald-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      summary:
        'Take full ownership of the production lifecycle. Learn how to package, deploy, automate, scale, and monitor modern cloud applications.',
      topics: [
        'Docker container multi-stage builds & image optimization',
        'Kubernetes orchestration: Deployments, Services, Ingress & Helm charts',
        'CI/CD Pipelines: Automated testing & zero-downtime rolling releases with GitHub Actions',
        'Infrastructure as Code (IaC) with Terraform & Cloudflare zero-trust',
        'Observability: Metrics, traces & logs with Prometheus and Grafana',
      ],
    },
    {
      id: 'coding',
      title: 'Modern Coding & Fullstack Systems',
      subtitle: 'Enterprise-Grade Software Development',
      badge: 'Hands-on Engineering',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      icon: Code2,
      iconColor: 'text-indigo-400',
      gradient: 'from-indigo-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-indigo-500/30 hover:border-indigo-500/60',
      summary:
        'Build production web applications with clean architecture, type safety, resilient database transactions, and real-time bidirectional communication.',
      topics: [
        'Next.js App Router, Server Components & Streaming SSR',
        'High-concurrency Node.js, Express & Go microservices',
        'WebSockets, Socket.io & Redis Pub/Sub for real-time collaboration',
        'PostgreSQL optimization: Indexes, query planning & connection pooling',
        'Authentication, OAuth2, session families & OWASP security standards',
      ],
    },
    {
      id: 'cp',
      title: 'Competitive Programming',
      subtitle: 'Speed, Algorithms & Math Rigor',
      badge: 'Elite Contest Track',
      badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      icon: Trophy,
      iconColor: 'text-rose-400',
      gradient: 'from-rose-900/30 via-slate-900/60 to-slate-900/40',
      borderColor: 'border-rose-500/30 hover:border-rose-500/60',
      summary:
        'Hone lightning-fast problem decomposition and mathematical intuition for competitive coding contests, ICPC, and elite coding challenges.',
      topics: [
        'Number Theory: Sieve of Eratosthenes, Modular Arithmetic, GCD/LCM',
        'Bit manipulation tricks and binary exponentiation algorithms',
        'Greedy algorithms, coordinate compression & two-pointer contest idioms',
        'Speed optimization techniques and edge-case eradication',
        'Codeforces & CodeChef rating growth blueprints',
      ],
    },
  ];

  const milestones = [
    {
      quarter: 'Current Phase',
      title: 'Technical Journal & Author Guild',
      status: 'Live in Production',
      statusColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description:
        'High-performance technical blog platform with real-time reader telemetry, rich Markdown editing, author approval workflow, and transactional newsletter alerts.',
      isCurrent: true,
    },
    {
      quarter: 'Phase 2 (Q1 2027)',
      title: 'Interactive System Design & DSA Practice Arena',
      status: 'In Active Engineering',
      statusColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description:
        'Interactive in-browser code editor, curated DSA pattern problem sets, and interactive system design visualizers with simulated load generators.',
      isCurrent: false,
    },
    {
      quarter: 'Phase 3 (Q2 2027)',
      title: 'Exploring AI & Generative Engineering Studio',
      status: 'Curriculum & Labs Staging',
      statusColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description:
        'Hands-on RAG architectures, local LLM execution sandboxes, and autonomous AI Agent builders integrated with real database connections.',
      isCurrent: false,
    },
    {
      quarter: 'Phase 4 (Q3 2027)',
      title: 'Job-Ready Portfolios, Mock Interviews & Hiring Match',
      status: 'Roadmap Milestone',
      statusColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description:
        'Resume review pipelines, capstone project verification badges, and direct introductions to engineering hiring partners.',
      isCurrent: false,
    },
  ];

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = waitlistEmail.trim() || user?.email;
    const nameToUse = waitlistName.trim() || user?.name || 'Fellow Engineer';

    if (!emailToUse) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubmittingWaitlist(true);

    try {
      // Submit interest via official inquiry endpoint
      const res = await fetchApi('/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          name: nameToUse,
          email: emailToUse,
          subject: `VIP Early Access Waitlist: ${interestTrack}`,
          message: `User ${nameToUse} (${emailToUse}) requested early access and roadmap notifications for the Job-Ready platform. Track of primary interest: ${interestTrack}.`,
        }),
      });

      if (res.success) {
        setWaitlistJoined(true);
        toast.success("🎉 You're on the VIP Waitlist! We will notify you the moment early access opens.");
      } else {
        toast.error(res.message || 'Could not join waitlist. Please try again.');
      }
    } catch {
      toast.error('Network error. Please try again later.');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  const selectedTrackData = tracks.find((t) => t.id === selectedTrack) || tracks[0];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-16 animate-fade-in">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 glass-card p-8 sm:p-14 text-center space-y-6">
        {/* Background glow effects */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>The Roadmap to Job-Readiness • What's Coming</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          We Are Building Your <br />
          <span className="gradient-text-amber">One-Stop Developer Ecosystem</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
          We are actively working to make you completely <strong>Job-Ready</strong>. Gain true production-grade exposure to{' '}
          <strong className="text-amber-400">Exploring AI</strong>, <strong className="text-cyan-400">DSA</strong>,{' '}
          <strong className="text-purple-400">System Design</strong>, <strong className="text-emerald-400">DevOps</strong>,{' '}
          <strong className="text-indigo-400">Systems Coding</strong>, and{' '}
          <strong className="text-rose-400">Competitive Programming</strong>.
        </p>

        {/* 4-Pillar Pill Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {['Learn Concepts', 'Practice Problems', 'Read Deep Dives', 'Apply in Projects'].map((pillar, idx) => (
            <span
              key={pillar}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 text-amber-400" />
              {pillar}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href="#tracks"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
          >
            <span>Explore Engineering Tracks</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#waitlist"
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass-card hover:bg-white/10 text-white font-semibold text-sm border border-white/15 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Join Early Access Waitlist</span>
          </a>
        </div>
      </div>

      {/* THE 4 PILLARS: ONE-STOP SOLUTION */}
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Methodology That Guarantees Mastery
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            The 4-Pillar One-Stop Solution
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Traditional platforms separate blogs, problem solving, and project building. Code &amp; Coffee unifies all 4 into a singular learning journey.
          </p>
        </div>

        {/* Pillar Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isSelected = activePillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePillar(p.id as any)}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'glass-card border-white/10 hover:border-white/20'
                }`}
              >
                <div
                  className={`p-2 rounded-xl bg-gradient-to-br ${
                    isSelected ? p.color : 'from-slate-800 to-slate-900'
                  } text-white`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                    {p.title}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    Pillar
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Pillar Card Detail */}
        {(() => {
          const current = pillars.find((p) => p.id === activePillar) || pillars[0];
          const CurrentIcon = current.icon;
          return (
            <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/15 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${current.color} text-white shadow-xl`}>
                    <CurrentIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${current.badgeBg}`}>
                      Pillar: {current.title}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      {current.subtitle}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <p className="text-sm text-gray-300 leading-relaxed">{current.description}</p>
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Why this matters for your career:
                    </span>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Most applicants fail technical loops because they memorize syntax without understanding real trade-offs. The{' '}
                      <strong className="text-white">{current.title}</strong> pillar bridges this gap directly.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                    What You Will Experience:
                  </span>
                  {current.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-3 text-xs text-gray-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* THE 6 CORE ENGINEERING DOMAINS */}
      <div id="tracks" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            6 High-Impact Specialization Tracks
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Engineering Tracks Under Active Development
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            Comprehensive curriculum, code sandboxes, and architectural labs tailored to make you a standout candidate for Tier-1 engineering teams.
          </p>
        </div>

        {/* Track Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTrack === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTrack(t.id)}
                className={`glass-card p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 cursor-pointer group hover:-translate-y-1 ${
                  isSelected
                    ? 'border-amber-500/60 shadow-xl shadow-amber-500/10 bg-slate-900/90'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl bg-slate-900 border border-white/10 ${t.iconColor} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${t.badgeColor}`}>
                      {t.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">{t.subtitle}</p>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                    {t.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400">
                    {t.topics.length} Mastery Modules
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                    <span>Inspect Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Track Deep-Dive Card */}
        {selectedTrackData && (
          <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 glass-card bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-slate-900 border border-white/10 ${selectedTrackData.iconColor}`}>
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
              We are opening closed beta cohorts for dedicated developers. Join the priority waitlist to get early invites, private coding sandboxes, and direct platform announcements.
            </p>

            {waitlistJoined ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">You're on the VIP List!</h3>
                <p className="text-xs text-emerald-200">
                  We'll dispatch your private early access invite directly to your inbox. Thank you for building the future of code with us!
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-4 pt-2 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={waitlistName}
                      onChange={(e) => setWaitlistName(e.target.value)}
                      placeholder={user?.name || 'e.g. Ramesh Das'}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Your Email</label>
                    <input
                      type="email"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      required
                      placeholder={user?.email || 'developer@example.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Primary Area of Interest
                  </label>
                  <select
                    value={interestTrack}
                    onChange={(e) => setInterestTrack(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900"
                  >
                    <option value="All Tracks (Full Job-Ready Bundle)">All Tracks (Full Job-Ready Bundle)</option>
                    <option value="Exploring AI & LLM Systems">Exploring AI & LLM Systems</option>
                    <option value="DSA & Algorithmic Problem Solving">DSA & Algorithmic Problem Solving</option>
                    <option value="High-Scale System Design">High-Scale System Design</option>
                    <option value="DevOps, Cloud & SRE">DevOps, Cloud & SRE</option>
                    <option value="Modern Coding & Fullstack Systems">Modern Coding & Fullstack Systems</option>
                    <option value="Competitive Programming">Competitive Programming</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submittingWaitlist}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                >
                  {submittingWaitlist ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering VIP Access...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Request Early Access Notification</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-gray-500 text-center">
                  Zero spam. We will only contact you regarding early access milestones and closed beta openings.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
