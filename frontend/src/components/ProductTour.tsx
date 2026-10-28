'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Code2,
  Sparkles,
  SunMoon,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Compass,
  Lightbulb,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const EVENT_START_TOUR = 'start-code-coffee-tour';

/**
 * Utility helper to programmatically launch or replay the product tour from anywhere in the app
 */
export function startProductTour() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_START_TOUR));
  }
}

interface TourStep {
  id: string;
  selector: string;
  fallbackSelector?: string;
  badge: string;
  title: string;
  description: string;
  proTip: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'amber' | 'cyan' | 'purple' | 'emerald';
  placement?: 'bottom' | 'top' | 'left' | 'right' | 'auto';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'blogs',
    selector: '[data-tour="tour-nav-blogs"]',
    badge: 'ENGINEERING ESSAYS',
    title: 'Distributed Systems & Architecture',
    description:
      'Deep dive into production-grade architectures: Redis caching topologies, PostgreSQL pooling, message queues, and high-concurrency scaling breakdowns.',
    proTip: 'Explore real-world system designs with benchmarks, metrics, and architecture diagrams.',
    icon: BookOpen,
    accentColor: 'amber',
  },
  {
    id: 'practice',
    selector: '[data-tour="tour-nav-practice"]',
    badge: 'PRACTICE ARENA',
    title: 'Curated SDE & CtCI Problem Sheets',
    description:
      'Sharpen your problem-solving momentum with curated Cracking the Coding Interview sheets. Track solved problems and unlock streak fire badges.',
    proTip: 'Every problem solved records telemetry and awards +10 XP to your developer ranking.',
    icon: Code2,
    accentColor: 'cyan',
  },
  {
    id: 'read',
    selector: '[data-tour="tour-nav-read"]',
    badge: 'READ CURRICULUM',
    title: 'Interactive Courses & Reading Arena',
    description:
      'Step-by-step masterclasses like GeeksforGeeks: rich markdown notes, screenshots, LeetCode coding challenges, and interactive quizzes.',
    proTip: 'Score >= 25% on lesson quizzes or mark lessons complete to unlock sequential modules!',
    icon: BookOpen,
    accentColor: 'amber',
  },
  {
    id: 'theme',
    selector: '[data-tour="tour-theme-toggle"]',
    badge: 'THEME ENGINE',
    title: 'High-Contrast Day & Night Modes',
    description:
      'Engineered for maximum developer focus. Switch between Obsidian Dark mode with amber accents for late-night sessions and Clean Paper Day mode.',
    proTip: 'Your theme preference persists automatically across all your devices and sessions.',
    icon: SunMoon,
    accentColor: 'amber',
  },
  {
    id: 'user',
    selector: '[data-tour="tour-nav-user"]',
    fallbackSelector: '[data-tour="tour-brand"]',
    badge: 'DEVELOPER PASSPORT',
    title: 'Your Profile, Streaks & Security',
    description:
      'Your engineering command center. Connect your LeetCode, Codeforces, and GitHub profiles, track your 365-day heatmaps, and monitor active device sessions.',
    proTip: 'You can replay this interactive walkthrough anytime from your user profile settings!',
    icon: User,
    accentColor: 'emerald',
  },
];

interface RectState {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export function ProductTour() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<RectState | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for auto-trigger on mount or auth state change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: NodeJS.Timeout | null = null;

    const checkTourTrigger = () => {
      // 1. If user just logged in / registered
      const justAuth = sessionStorage.getItem('cnc_just_authenticated') === 'true';

      if (user) {
        const userTourKey = `cnc_tour_user_${user.id || (user as any)._id}`;
        const userTourDone = localStorage.getItem(userTourKey) === 'true';

        if (justAuth || !userTourDone) {
          sessionStorage.removeItem('cnc_just_authenticated');
          timer = setTimeout(() => {
            setCurrentStep(0);
            setIsOpen(true);
          }, 900);
        }
      } else {
        // 2. Guest / Anonymous First Visit
        const guestTourDone =
          localStorage.getItem('cnc_tour_guest') === 'true' ||
          localStorage.getItem('cnc_onboarded_v1') === 'true';

        if (!guestTourDone) {
          timer = setTimeout(() => {
            setCurrentStep(0);
            setIsOpen(true);
          }, 1400);
        }
      }
    };

    checkTourTrigger();

    // 3. Listen to manual trigger events (e.g. from Profile "Replay Tour" button)
    const handleManualStart = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener(EVENT_START_TOUR, handleManualStart);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(EVENT_START_TOUR, handleManualStart);
    };
  }, [user]);

  // Dismiss / Complete Tour
  const handleComplete = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(`cnc_tour_user_${user.id || (user as any)._id}`, 'true');
      }
      localStorage.setItem('cnc_tour_guest', 'true');
      localStorage.setItem('cnc_onboarded_v1', 'true');
      sessionStorage.removeItem('cnc_just_authenticated');
    }
  }, [user]);

  // Recalculate target spotlight rect
  const updateSpotlight = useCallback(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    let el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el && step.fallbackSelector) {
      el = document.querySelector(step.fallbackSelector) as HTMLElement | null;
    }

    if (el) {
      // Check if element is hidden (e.g. inside a closed desktop nav on mobile)
      const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;

      if (isVisible) {
        const rect = el.getBoundingClientRect();
        const padding = 8;
        setSpotlightRect({
          x: Math.max(0, rect.left - padding),
          y: Math.max(0, rect.top - padding),
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          visible: true,
        });

        // Smoothly scroll target into view if offscreen
        const inViewport =
          rect.top >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);

        if (!inViewport) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    // Fallback if target element not visible on current screen/view
    setSpotlightRect({
      x: window.innerWidth / 2 - 140,
      y: 90,
      width: 280,
      height: 54,
      visible: false,
    });
  }, [isOpen, currentStep]);

  // Update spotlight whenever step or open status changes
  useEffect(() => {
    if (!isOpen) {
      setSpotlightRect(null);
      return;
    }

    updateSpotlight();

    const handleResizeOrScroll = () => {
      requestAnimationFrame(updateSpotlight);
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, [isOpen, currentStep, updateSpotlight]);

  // Keyboard navigation: Escape to skip, Left/Right arrows to navigate
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleComplete();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          handleComplete();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) {
          setCurrentStep((s) => s - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, handleComplete]);

  if (!isOpen) return null;

  const activeStep = TOUR_STEPS[currentStep];
  const StepIcon = activeStep.icon;
  const progressPercent = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  // Calculate Tooltip position relative to spotlight
  const computeTooltipStyle = (): React.CSSProperties => {
    if (isMobile) {
      // Dock to bottom on mobile for optimal tap targets and ergonomics
      return {
        position: 'fixed',
        bottom: '20px',
        left: '16px',
        right: '16px',
        maxWidth: '480px',
        margin: '0 auto',
        zIndex: 10001,
      };
    }

    if (!spotlightRect || !spotlightRect.visible) {
      // Centered fallback
      return {
        position: 'fixed',
        top: '120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '420px',
        zIndex: 10001,
      };
    }

    const cardWidth = 420;
    const cardEstHeight = 280;
    const targetCenterX = spotlightRect.x + spotlightRect.width / 2;

    // Horizontal positioning: align with target center, clamped to screen edges
    const left = Math.max(20, Math.min(window.innerWidth - cardWidth - 20, targetCenterX - cardWidth / 2));

    // Vertical positioning: default below target, or flip above if near bottom
    let top = spotlightRect.y + spotlightRect.height + 16;
    if (top + cardEstHeight > window.innerHeight - 20 && spotlightRect.y > cardEstHeight + 20) {
      top = Math.max(20, spotlightRect.y - cardEstHeight - 16);
    }

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      zIndex: 10001,
    };
  };

  const accentGlow =
    activeStep.accentColor === 'cyan'
      ? 'from-cyan-500/20 via-blue-500/10'
      : activeStep.accentColor === 'purple'
      ? 'from-purple-500/20 via-pink-500/10'
      : activeStep.accentColor === 'emerald'
      ? 'from-emerald-500/20 via-teal-500/10'
      : 'from-amber-500/20 via-orange-500/10';

  const accentBadge =
    activeStep.accentColor === 'cyan'
      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
      : activeStep.accentColor === 'purple'
      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      : activeStep.accentColor === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

  const accentProgressBar =
    activeStep.accentColor === 'cyan'
      ? 'from-cyan-400 to-blue-500'
      : activeStep.accentColor === 'purple'
      ? 'from-purple-400 to-pink-500'
      : activeStep.accentColor === 'emerald'
      ? 'from-emerald-400 to-teal-500'
      : 'from-amber-400 via-orange-400 to-amber-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Platform Feature Tour"
      className="fixed inset-0 z-[10000] pointer-events-auto select-none"
    >
      {/* Dynamic Animated SVG Spotlight Mask */}
      <svg
        className="w-full h-full fixed inset-0 pointer-events-none transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="cnc-tour-spotlight-mask">
            {/* White base fills entire screen */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout creates transparent portal to highlighted element */}
            {spotlightRect && spotlightRect.visible && (
              <rect
                x={spotlightRect.x}
                y={spotlightRect.y}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx="14"
                ry="14"
                fill="black"
                className="transition-all duration-500 ease-out"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop covering everything except the cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.82)"
          mask="url(#cnc-tour-spotlight-mask)"
          className="pointer-events-auto cursor-pointer"
          onClick={handleComplete}
        />
      </svg>

      {/* Animated Glowing Accent Frame around highlighted element */}
      {spotlightRect && spotlightRect.visible && (
        <div
          style={{
            position: 'fixed',
            left: `${spotlightRect.x}px`,
            top: `${spotlightRect.y}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
            borderRadius: '14px',
            pointerEvents: 'none',
            zIndex: 10001,
          }}
          className="transition-all duration-500 ease-out border-2 border-amber-400/90 tour-spotlight-active"
        >
          {/* Pulsing Beacon Dot */}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-gradient-to-r from-amber-400 to-orange-500 shadow-md shadow-amber-500/50" />
          </span>
        </div>
      )}

      {/* Floating Interactive Tooltip Card */}
      <div
        ref={cardRef}
        style={computeTooltipStyle()}
        className="glass-card rounded-2xl border border-white/20 p-5 sm:p-6 shadow-2xl bg-slate-950/95 backdrop-blur-2xl animate-fade-in relative overflow-hidden transition-all duration-300"
      >
        {/* Ambient Top Glow */}
        <div
          className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${accentGlow} to-transparent blur-2xl pointer-events-none`}
        />

        {/* Top Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4 relative">
          <div
            className={`h-full bg-gradient-to-r ${accentProgressBar} transition-all duration-500 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Card Header: Step counter + Badge + Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider border bg-white/5 text-gray-300 border-white/10">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider border ${accentBadge}`}
            >
              {activeStep.badge}
            </span>
          </div>

          <button
            onClick={handleComplete}
            aria-label="Skip Tour"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Skip Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Icon */}
        <div className="flex items-start gap-3.5 mb-2.5">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 text-amber-400 shrink-0 shadow-lg">
            <StepIcon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {activeStep.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              {activeStep.description}
            </p>
          </div>
        </div>

        {/* Pro-Tip Callout */}
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-[11px] sm:text-xs text-amber-200/90 flex items-start gap-2.5 mb-5">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{activeStep.proTip}</span>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleComplete}
              className="text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors px-2 py-1"
            >
              Skip
            </button>
            <span className="hidden sm:inline-block text-[10px] text-gray-500 font-mono">
              [←/→ keys]
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            {currentStep < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-102 cursor-pointer"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-102 cursor-pointer"
              >
                Start Exploring <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Export default and alias for backwards compatibility
export default ProductTour;
export { ProductTour as OnboardingModal };
