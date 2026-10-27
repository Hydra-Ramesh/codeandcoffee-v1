'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Trophy, Sparkles, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const ONBOARDING_STORAGE_KEY = 'cnc_onboarded_v1';

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!onboarded) {
        // Slight delay so the user first sees the loaded page
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    }
  };

  const trapRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleDismiss,
  });

  const steps = [
    {
      icon: BookOpen,
      badge: 'Architecture & Systems',
      title: 'Welcome to Code & Coffee',
      description:
        'A high-performance publication dedicated to distributed systems, database scaling, caching topologies, and cloud craftsmanship. Read real-world production engineering breakdowns written by developers.',
      highlight: 'Production-ready notes with code, benchmarks, and architecture diagrams.',
    },
    {
      icon: Sparkles,
      badge: 'Practice Arena',
      title: 'Sharpen Your Algorithmic Edge',
      description:
        'Level up with Cracking the Coding Interview (CtCI) and SDE Curated Sheets. Track your problem-solving momentum with our 365-day activity matrix and earn 10 points for every solve.',
      highlight: 'Unlock full practice sheets, track your streak, and earn fire emojis for 5+ solves.',
    },
    {
      icon: Trophy,
      badge: 'Community & Showcase',
      title: 'Climb the Global Leaderboard',
      description:
        'Connect your LeetCode, Codeforces, CodeChef, and GitHub profiles directly in your settings. Showcase your coding verified handles and rank among top software engineers globally.',
      highlight: 'Transparent telemetry, peer activity feeds, and verified profile badges.',
    },
  ];

  if (!isOpen) return null;

  const activeStep = steps[currentStep];
  const StepIcon = activeStep.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={trapRef}
        className="relative w-full max-w-lg glass-card rounded-3xl border border-white/20 flex flex-col overflow-hidden shadow-2xl bg-slate-950/95"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          aria-label="Skip onboarding"
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-8 bg-gradient-to-r from-amber-400 to-amber-500'
                    : idx < currentStep
                    ? 'w-3 bg-amber-500/50'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Step Icon & Badge */}
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <StepIcon className="w-6 h-6" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {activeStep.badge}
            </span>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 id="onboarding-title" className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {activeStep.title}
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">{activeStep.description}</p>
          </div>

          {/* Highlight Callout */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-amber-200/90 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{activeStep.highlight}</span>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            {currentStep > 0 ? (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                Skip Tour
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-102"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all hover:scale-102"
              >
                Get Started <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
