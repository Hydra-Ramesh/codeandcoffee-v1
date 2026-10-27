'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on authentication flows, admin dashboard, and the Explore Blogs catalog (/blogs)
  if (
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/admin') ||
    pathname === '/blogs'
  ) {
    return null;
  }

  return (
    <footer className="w-full bg-[#060911] border-t border-white/10 py-12 mt-20 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Links & Contact Info Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-white/10 text-sm">
          {/* Engineering Tracks */}
          <div>
            <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-4">
              Engineering Tracks
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/blogs?category=System+Design" className="hover:text-amber-400 transition-colors">
                  System Design &amp; Scale
                </Link>
              </li>
              <li>
                <Link href="/blogs?category=Web+Engineering" className="hover:text-amber-400 transition-colors">
                  Next.js &amp; Frontend
                </Link>
              </li>
              <li>
                <Link href="/blogs?category=Security+%26+DevOps" className="hover:text-amber-400 transition-colors">
                  Security &amp; Zero-Trust
                </Link>
              </li>
              <li>
                <Link href="/blogs?category=Backend" className="hover:text-amber-400 transition-colors">
                  PostgreSQL &amp; Redis
                </Link>
              </li>
              <li>
                <Link href="/practice" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1.5">
                  <span>Practice Arena (Sheets)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-amber-400 font-medium transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/become-contributor" className="text-gray-300 hover:text-amber-400 font-medium transition-colors">
                  Write for Us (Contributors)
                </Link>
              </li>
              <li>
                <Link href="/whats-coming" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span>What's Coming?</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30">Roadmap</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-amber-400 transition-colors">
                  All Publications
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div>
            <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-4">
              Legal &amp; Trust
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-amber-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-amber-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-amber-400 transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Office Address & Contact */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h4 className="font-semibold text-white uppercase text-xs tracking-wider mb-4 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Office Address
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed">
              Khejuri, East Medinipur<br />
              West Bengal, India, 721430
            </p>
            <div className="pt-2">
              <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
                Direct Contact
              </span>
              <a
                href="mailto:codeandcoffee2024@gmail.com"
                className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-mono inline-flex items-center gap-1.5 break-all"
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                codeandcoffee2024@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright & Socials */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span>&copy; 2026 Code &amp; Coffee Inc. All rights reserved.</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-400">
              Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> &amp; fresh roast
            </span>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            {/* GitHub SVG */}
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            {/* X / Twitter SVG */}
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* LinkedIn SVG */}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
