'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import { Layers, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';

interface MermaidBlockProps {
  chart: string;
}

export default function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const diagramId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const renderChart = async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;

        // Detect dark mode from html class or media query
        const isDark =
          typeof document !== 'undefined' &&
          (document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches);

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'neutral',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          themeVariables: isDark
            ? {
                primaryColor: '#f59e0b',
                primaryTextColor: '#ffffff',
                primaryBorderColor: '#d97706',
                lineColor: '#94a3b8',
                secondaryColor: '#1e293b',
                tertiaryColor: '#0f172a',
                background: '#0b0f19',
              }
            : {
                primaryColor: '#fef3c7',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#f59e0b',
                lineColor: '#64748b',
                secondaryColor: '#f8fafc',
                tertiaryColor: '#f1f5f9',
              },
        });

        // Clean up the chart text (remove extra surrounding backticks or language prefix if present)
        const cleanChart = chart
          .replace(/^```mermaid\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/```$/, '')
          .trim();

        if (!cleanChart) {
          if (isMounted) {
            setSvgHtml('');
            setLoading(false);
          }
          return;
        }

        // Render SVG with a unique ID
        const renderId = `${diagramId}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, cleanChart);

        if (isMounted) {
          setSvgHtml(svg);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('Failed to render Mermaid diagram:', err);
        if (isMounted) {
          setError(err?.message || 'Invalid Mermaid syntax');
          setLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, diagramId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60 overflow-hidden shadow-md">
      {/* Top Diagram Toolbar */}
      <div className="px-4 py-2.5 bg-slate-100/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300 font-semibold">
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>Diagram</span>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {showRaw ? 'Hide Raw Code' : 'View Raw Code'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title="Copy Mermaid source"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diagram Body */}
      <div className="p-4 sm:p-6 overflow-x-auto flex items-center justify-center min-h-[140px]">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-500 py-6 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Rendering diagram...</span>
          </div>
        ) : error ? (
          <div className="w-full space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to render Mermaid diagram</p>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">{error}</p>
              </div>
            </div>

            {(showRaw || true) && (
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800">
                {chart}
              </pre>
            )}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto transition-all"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        )}
      </div>
    </div>
  );
}
