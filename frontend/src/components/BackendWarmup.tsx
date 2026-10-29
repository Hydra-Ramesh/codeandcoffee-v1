'use client';

import { useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

/**
 * BackendWarmup
 * ------------------------------------------------------------------
 * Eagerly wakes up free-tier cloud containers (Render/Railway/Neon)
 * in the background when a user arrives at any page on the website.
 *
 * Runs non-blockingly during browser idle time so it never impacts
 * First Contentful Paint (FCP) or Core Web Vitals.
 */
export default function BackendWarmup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if warmed recently in this session (within 10 minutes)
    const lastWarmupStr = sessionStorage.getItem('cc_backend_warmed_timestamp');
    if (lastWarmupStr) {
      const elapsed = Date.now() - parseInt(lastWarmupStr, 10);
      if (elapsed < 10 * 60 * 1000) {
        return; // Already warmed recently
      }
    }

    const runWarmup = async () => {
      try {
        sessionStorage.setItem('cc_backend_warmed_timestamp', Date.now().toString());

        // Extract base /api/v1 URL
        const healthUrl = `${API_BASE_URL}/health`;

        await fetch(healthUrl, {
          method: 'GET',
          cache: 'no-store',
          keepalive: true,
        });
      } catch {
        // Silently swallow; warmup is opportunistic
      }
    };

    // Run when browser is idle to avoid competing for network/CPU during page load
    if ('requestIdleCallback' in window) {
      const handle = (window as unknown as { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(runWarmup);
      return () => {
        if ('cancelIdleCallback' in window) {
          (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(runWarmup, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
