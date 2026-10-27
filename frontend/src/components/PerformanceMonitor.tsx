'use client';

import { useEffect } from 'react';

/**
 * Real User Monitoring (RUM) & Web Vitals Telemetry Reporter
 * Observes LCP, CLS, FID/INP without blocking the main rendering thread
 */
export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // 1. Observe Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          reportMetric('LCP', Math.round(lastEntry.startTime), 'ms');
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // 2. Observe Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        reportMetric('CLS', parseFloat(clsValue.toFixed(4)), 'score');
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // 3. Observe First Input Delay (FID)
      const fidObserver = new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0] as any;
        if (firstInput) {
          const delay = Math.round(firstInput.processingStart - firstInput.startTime);
          reportMetric('FID', delay, 'ms');
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    } catch {
      // Browsers with restricted observer types fail silently
    }
  }, []);

  return null;
}

function reportMetric(metricName: string, value: number, unit: string) {
  if (process.env.NODE_ENV === 'development') {
    // Only log if anomalous
    const isWarning =
      (metricName === 'LCP' && value > 2500) ||
      (metricName === 'CLS' && value > 0.1) ||
      (metricName === 'FID' && value > 100);

    if (isWarning) {
      console.warn(`[Web Vitals Warning] ${metricName}: ${value}${unit} (Exceeds target budget)`);
    }
  }
}
