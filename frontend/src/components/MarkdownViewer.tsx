'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownViewerProps {
  content?: string | null;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  const safeContent = typeof content === 'string' ? content : '';
  if (!safeContent.trim()) {
    return null;
  }

  return (
    <div className="markdown-content max-w-none text-slate-800 dark:text-gray-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1({ children, ...props }) {
            return (
              <h1
                className="text-3xl sm:text-4xl font-extrabold mt-8 mb-4 pb-3 border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white tracking-tight leading-tight"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2
                className="text-2xl sm:text-3xl font-bold mt-8 mb-3 text-slate-900 dark:text-gray-100 tracking-tight leading-snug"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3
                className="text-xl sm:text-2xl font-bold mt-6 mb-2.5 text-slate-900 dark:text-gray-100 tracking-tight leading-snug"
                {...props}
              >
                {children}
              </h3>
            );
          },
          h4({ children, ...props }) {
            return (
              <h4
                className="text-lg sm:text-xl font-bold mt-5 mb-2 text-slate-900 dark:text-gray-200 tracking-tight"
                {...props}
              >
                {children}
              </h4>
            );
          },
          p({ children, ...props }) {
            return (
              <p
                className="my-4 text-base sm:text-lg leading-relaxed text-slate-800 dark:text-gray-200 font-normal"
                {...props}
              >
                {children}
              </p>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul
                className="my-4 pl-6 list-disc space-y-2 text-slate-800 dark:text-gray-200 marker:text-amber-600 dark:marker:text-amber-400"
                {...props}
              >
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol
                className="my-4 pl-6 list-decimal space-y-2 text-slate-800 dark:text-gray-200 marker:text-amber-600 dark:marker:text-amber-400 font-medium"
                {...props}
              >
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="leading-relaxed text-slate-800 dark:text-gray-200" {...props}>
                {children}
              </li>
            );
          },
          strong({ children, ...props }) {
            return (
              <strong className="font-bold text-slate-950 dark:text-white" {...props}>
                {children}
              </strong>
            );
          },
          em({ children, ...props }) {
            return (
              <em className="italic text-slate-800 dark:text-gray-200" {...props}>
                {children}
              </em>
            );
          },
          hr({ ...props }) {
            return <hr className="my-8 border-slate-200 dark:border-white/10" {...props} />;
          },
          code({ className, children, ...props }) {
            return (
              <code
                className="px-1.5 py-0.5 rounded-md text-[0.88em] font-mono font-semibold bg-amber-50 dark:bg-slate-800/90 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-white/10"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children, ...props }) {
            return (
              <pre
                className="relative group my-6 overflow-x-auto p-4 sm:p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 text-[#f8fafc] font-mono text-sm leading-relaxed shadow-xl"
                {...props}
              >
                {children}
              </pre>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-6 border-l-4 border-amber-500 pl-4 py-2.5 italic text-slate-700 dark:text-gray-300 bg-amber-500/5 dark:bg-amber-500/10 rounded-r-xl">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent shadow-sm">
                <table className="w-full text-left border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-amber-400 font-bold p-3 border-b border-slate-200 dark:border-white/10">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="p-3 border-b border-slate-100 dark:border-white/5 text-slate-800 dark:text-gray-300">
                {children}
              </td>
            );
          },
          a({ href, children, ...props }) {
            const hrefStr = typeof href === 'string' ? href : '';
            // Strict XSS Prevention: Disallow javascript: schemes
            const isSafe = hrefStr && !hrefStr.toLowerCase().trim().startsWith('javascript:');
            const safeHref = isSafe ? hrefStr : '#';
            const isExternal = safeHref.startsWith('http');
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 transition-colors font-semibold"
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ src, alt, ...props }) {
            let safeSrc = typeof src === 'string' ? src.trim() : '';
            if (!safeSrc) return null;
            // Handle local uploads or raw filenames without protocol
            if (safeSrc.startsWith('image_')) {
              safeSrc = `/uploads/${safeSrc}`;
            }
            if (safeSrc.startsWith('/uploads/')) {
              const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
              safeSrc = `${backendUrl}${safeSrc}`;
            }
            return (
              <img
                src={safeSrc}
                alt={alt || 'Visual'}
                className="rounded-2xl border border-slate-200 dark:border-white/10 my-6 max-h-[500px] w-full object-cover shadow-xl"
                loading="lazy"
                onError={(e) => {
                  // Gracefully hide broken 404 images without breaking page layout
                  (e.target as HTMLElement).style.display = 'none';
                }}
                {...props}
              />
            );
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}
