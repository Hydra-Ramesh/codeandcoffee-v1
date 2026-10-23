import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Code & Coffee — Engineering Journal for Scalable Software',
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
  authors: [{ name: 'Code & Coffee Engineering Staff' }],
  openGraph: {
    title: 'Code & Coffee — Engineering Journal',
    description: 'High-throughput architecture, zero-trust security, and modern web engineering deep-dives.',
    url: 'https://codeandcoffee.dev',
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
    title: 'Code & Coffee — Engineering Journal',
    description: 'Where deep code meets high caffeine.',
    images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'],
  },
};

import React, { Suspense } from 'react';

// ...
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-[#f3f4f6] min-h-screen flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
        <AuthProvider>
          <div className="relative min-h-screen flex flex-col justify-between bg-mesh-radial">
            <Suspense fallback={<div className="h-20" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
