'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownViewerProps {
  content: string;
}

export default function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="markdown-content max-w-none text-gray-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          code({ className, children, ...props }) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre({ children, ...props }) {
            return (
              <pre className="relative group my-6 overflow-x-auto p-4 rounded-xl bg-slate-950 border border-white/10 font-mono text-sm leading-relaxed" {...props}>
                {children}
              </pre>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-6 border-l-4 border-amber-500 pl-4 py-2 italic text-gray-300 bg-amber-500/5 rounded-r-xl">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6 rounded-xl border border-white/10">
                <table className="w-full text-left border-collapse text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-slate-900/90 text-amber-300 p-3 font-semibold border-b border-white/10">{children}</th>;
          },
          td({ children }) {
            return <td className="p-3 border-b border-white/5 text-gray-300">{children}</td>;
          },
          a({ href, children, ...props }) {
            // Strict XSS Prevention: Disallow javascript: schemes
            const isSafe = href && !href.toLowerCase().trim().startsWith('javascript:');
            const safeHref = isSafe ? href : '#';
            const isExternal = safeHref.startsWith('http');
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium"
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt || 'Visual'}
                className="rounded-2xl border border-white/10 my-6 max-h-[500px] w-full object-cover shadow-xl"
                loading="lazy"
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
