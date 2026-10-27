'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Coffee, ShieldAlert, User, LogOut, Menu, X, Sparkles, PenTool, Code2 } from 'lucide-react';
import { optimizeImageUrl } from '../lib/image';

import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Explore Blogs', href: '/blogs' },
    { name: 'Practice', href: '/practice', isPractice: true },
    { name: "What's Coming?", href: '/whats-coming', isHighlight: true },
    { name: 'Write for Us', href: '/become-contributor' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-transparent border border-amber-500/30 group-hover:border-amber-400/60 transition-all duration-300">
            <Coffee className="w-6 h-6 text-amber-400 group-hover:rotate-6 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full pulse-beacon" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Code <span className="gradient-text-amber">&amp; Coffee</span>
            </span>
            <span className="text-[11px] font-mono tracking-wider text-gray-400">
              ENGINEERING JOURNAL
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const isHighlight = (link as any).isHighlight;
            const isPractice = (link as any).isPractice;

            if (isPractice) {
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 shadow-sm shadow-cyan-500/25'
                      : 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 hover:border-cyan-400/50'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-6 transition-transform duration-300" />
                  <span>{link.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-xs shadow-cyan-500/30">
                    Sheets
                  </span>
                </Link>
              );
            }

            if (isHighlight) {
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`group relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/15 border border-amber-500/40 shadow-sm shadow-amber-500/25'
                      : 'text-amber-400 hover:text-amber-300 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 border border-amber-500/30 hover:border-amber-400/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{link.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs shadow-amber-500/30">
                    Roadmap
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Profile */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-purple-500/25 border border-purple-400/30 transition-all"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  Admin Panel
                </Link>
              )}

              {!isAdmin && user.role === 'CONTRIBUTOR' && (
                <Link
                  href="/admin/blogs/new"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Author Studio
                </Link>
              )}

              <Link
                href="/user/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg glass-card hover:border-amber-500/40 transition-all"
              >
                <img
                  src={
                    optimizeImageUrl(user.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
                  }
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-slate-800 border border-white/20"
                />
                <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
                  {user.name}
                </span>
              </Link>

              <button
                onClick={logout}
                title="Sign out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button & Theme Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile navigation menu"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-b border-white/10 px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => {
            const isHighlight = (link as any).isHighlight;
            const isPractice = (link as any).isPractice;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isHighlight
                    ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                    : isPractice
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30'
                    : isActive
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isHighlight && <Sparkles className="w-4 h-4 text-amber-400" />}
                  {isPractice && <Code2 className="w-4 h-4 text-cyan-400" />}
                  {link.name}
                </span>
                {isHighlight && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950">
                    Roadmap
                  </span>
                )}
                {isPractice && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950">
                    Sheets
                  </span>
                )}
              </Link>
            );
          })}

          {user ? (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <img
                  src={
                    optimizeImageUrl(user.avatar, { width: 80, height: 80, crop: 'fill' }) ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
                  }
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-white/20"
                />
                <div>
                  <div className="text-sm font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-purple-300 font-medium bg-purple-500/10"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}

              {!isAdmin && user.role === 'CONTRIBUTOR' && (
                <Link
                  href="/admin/blogs/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-400 font-medium bg-amber-500/10"
                >
                  <PenTool className="w-4 h-4" />
                  Author Studio
                </Link>
              )}

              <Link
                href="/user/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white"
              >
                <User className="w-4 h-4" />
                My Profile
              </Link>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-lg text-gray-300 border border-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-lg bg-amber-500 text-slate-950 font-semibold"
              >
                Get Started
              </Link>
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex items-center justify-between px-3 py-2">
            <span className="text-sm font-medium text-gray-400">Appearance</span>
            <ThemeToggle showLabel={true} />
          </div>
        </div>
      )}
    </header>
  );
}
