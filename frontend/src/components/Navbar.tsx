'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Coffee, ShieldAlert, User, LogOut, Menu, X, Sparkles, PenTool, Code2, Compass, BookOpen } from 'lucide-react';
import { optimizeImageUrl } from '../lib/image';
import { startProductTour } from './ProductTour';

import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isStaff = Boolean(user && (user.role === 'ADMIN' || user.role === 'CONTRIBUTOR'));

  const isReaderStudio = Boolean(
    pathname?.startsWith('/read/') && pathname.split('/').filter(Boolean).length >= 4
  );

  if (isReaderStudio) {
    return null;
  }

  const navLinks = [
    { name: 'Explore Blogs', href: '/blogs', dataTour: 'tour-nav-blogs' },
    { name: 'Read', href: '/read', isRead: true, dataTour: 'tour-nav-read' },
    { name: 'Practice', href: '/practice', isPractice: true, dataTour: 'tour-nav-practice' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" data-tour="tour-brand" className="flex items-center gap-3 group">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/10 to-transparent border border-amber-500/30 group-hover:border-amber-400/60 transition-all duration-300">
            <Coffee className="w-6 h-6 text-amber-400 group-hover:rotate-6 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full pulse-beacon" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Code <span className="gradient-text-amber">&amp; Coffee</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            const isRead = (link as any).isRead;
            const isPractice = (link as any).isPractice;
            const dataTour = (link as any).dataTour;

            if (isRead) {
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  data-tour={dataTour}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/15 border border-amber-500/40 shadow-sm shadow-amber-500/25'
                      : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 hover:border-amber-400/50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-6 transition-transform duration-300" />
                  <span>{link.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-xs shadow-amber-500/30">
                    Learn
                  </span>
                </Link>
              );
            }

            if (isPractice) {
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  data-tour={dataTour}
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

            return (
              <Link
                key={link.name}
                href={link.href}
                data-tour={dataTour}
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
          <div data-tour="tour-theme-toggle">
            <ThemeToggle />
          </div>

          {/* Interactive Tour Launcher (hidden for Admin or Contributor per requirement) */}
          {!isStaff && (
            <button
              onClick={startProductTour}
              type="button"
              title="Interactive Tour Guide"
              className="p-2 rounded-xl text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition-colors border border-amber-500/20 cursor-pointer"
            >
              <Compass className="w-5 h-5 animate-spin-slow" />
            </button>
          )}

          {user ? (
            <div data-tour="tour-nav-user" className="flex items-center gap-3">
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
            <div data-tour="tour-nav-user" className="flex items-center gap-2.5">
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
            const isRead = (link as any).isRead;
            const isPractice = (link as any).isPractice;
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isRead
                    ? 'text-amber-300 bg-amber-500/15 border border-amber-500/30'
                    : isPractice
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30'
                    : isActive
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-2">
                  {isRead && <BookOpen className="w-4 h-4 text-amber-400" />}
                  {isPractice && <Code2 className="w-4 h-4 text-cyan-400" />}
                  {link.name}
                </span>
                {isRead && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950">
                    Learn
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

          {!isStaff && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  startProductTour();
                }}
                type="button"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Interactive Feature Tour
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300">
                  Explore
                </span>
              </button>
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
