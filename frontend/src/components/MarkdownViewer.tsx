'use client';

import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Copy, Check } from 'lucide-react';
import MermaidBlock from './MermaidBlock';

interface MarkdownViewerProps {
  content?: string | null;
}

function PreBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (preRef.current) {
      const codeText = preRef.current.innerText || '';
      navigator.clipboard.writeText(codeText.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group my-6">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
        title="Copy code"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>

      <pre
        ref={preRef}
        className="overflow-x-auto p-4 sm:p-5 rounded-2xl bg-[#0b0f19] border border-slate-800 text-[#f8fafc] font-mono text-sm leading-relaxed shadow-xl [&_code]:bg-transparent [&_code]:border-0 [&_code]:border-none [&_code]:p-0 [&_code]:text-inherit [&_code]:shadow-none [&_code]:rounded-none [&_code]:font-normal [&_code]:block [&_code]:w-full"
        {...props}
      >
        {children}
      </pre>
    </div>
  );
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
            if (typeof className === 'string' && className.includes('language-mermaid')) {
              return <MermaidBlock chart={String(children || '').trim()} />;
            }

            // Check if this is a block code element (inside pre, has language-* class, or has newlines)
            const isBlock = Boolean(
              (typeof className === 'string' && className.startsWith('language-')) ||
              (typeof children === 'string' && children.includes('\n'))
            );

            if (isBlock) {
              return (
                <code
                  className="font-mono text-inherit bg-transparent border-0 p-0 block w-full whitespace-pre"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Inline code snippet
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
            const childArray = React.Children.toArray(children);
            const firstChild = childArray[0];
            if (
              React.isValidElement(firstChild) &&
              typeof (firstChild.props as any)?.className === 'string' &&
              (firstChild.props as any).className.includes('language-mermaid')
            ) {
              const mermaidChart = String((firstChild.props as any).children || '').trim();
              return <MermaidBlock chart={mermaidChart} />;
            }
            return <PreBlock {...props}>{children}</PreBlock>;
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
