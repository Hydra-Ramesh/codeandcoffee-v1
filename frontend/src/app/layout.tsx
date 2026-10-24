import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://codeandcoffee.live'),
  title: {
    default: 'Code & Coffee — Learn, Practice, Read, Apply',
    template: '%s | Code & Coffee',
  },
  description:
    'A high-performance publication for distributed systems, database engineering, cloud architecture, and modern web application craftsmanship.',
  keywords: [
    'System Design',
    'PostgreSQL',
    'Database Engineering',
    'Distributed Systems',
    'Caching Strategies',
    'Next.js',
    'Node.js',
    'Software Architecture',
    'Developer Blog',
    'Cloud Security',
  ],
  authors: [{ name: 'Ramesh Das' }, { name: 'Code & Coffee Engineering Staff' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Code & Coffee — Learn, Practice, Read, Apply',
    description: 'High-throughput architecture, zero-trust security, and modern web engineering deep-dives.',
    url: 'https://codeandcoffee.live',
    siteName: 'Code & Coffee',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
        alt: 'Code & Coffee Developer Journal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code & Coffee — Learn, Practice, Read, Apply',
    description: 'Where deep code meets high caffeine.',
    images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'],
  },
};

import React, { Suspense } from 'react';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          id="theme-init"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('code_coffee_theme');
                  var theme = stored === 'light' || stored === 'dark'
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  document.documentElement.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300"
      >
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="relative min-h-screen flex flex-col justify-between bg-mesh-radial transition-colors duration-300">
                <Suspense fallback={<div className="h-20" />}>
                  <Navbar />
                </Suspense>
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
                <Footer />
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
