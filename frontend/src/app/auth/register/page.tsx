'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Coffee, User, Mail, Lock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, loginWithOAuth } = useAuth();

  const redirectParam = searchParams.get('redirect');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isNameValid = name.trim().length >= 2;
  const isPasswordValid = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched({ name: true, email: true, password: true });

    if (!isNameValid || !isEmailValid || !isPasswordValid) {
      setError('Please resolve the highlighted field errors before continuing.');
      return;
    }

    setLoading(true);
    const res = await register(name, email, password);
    if (res.success) {
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push('/blogs');
      }
    } else {
      setError(res.message || 'Registration failed.');
    }
    setLoading(false);
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    setLoading(true);
    if (redirectParam && typeof window !== 'undefined') {
      sessionStorage.setItem('auth_redirect', redirectParam);
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join the Community</h1>
          <p className="text-xs text-gray-400">Create your account to read full deep-dives, react, and comment</p>
        </div>

        {redirectParam && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Create a free developer account to read the full publication.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            Google
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('github')}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl glass-card hover:bg-white/10 text-xs font-semibold text-gray-200 border border-white/10 transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 uppercase font-semibold">
          <div className="flex-1 h-px bg-white/10" />
          <span>Or with credentials</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Anti-Bot Honeypot Trap (Hidden from real users, caught if bots fill it) */}
          <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
            <label htmlFor="reg_website_trap">Website</label>
            <input
              id="reg_website_trap"
              type="text"
              name="website_trap"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">Full Name</label>
              {touched.name && isNameValid && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              )}
            </div>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Ada Lovelace"
                required
                className={`w-full pl-10 pr-9 py-2.5 min-h-[44px] text-xs rounded-xl glass-input text-white ${
                  touched.name && !isNameValid ? 'border-red-500/60 focus:border-red-500' : ''
                }`}
              />
              {touched.name && isNameValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
            {touched.name && !isNameValid && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" /> Name must be at least 2 characters.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">Email Address</label>
              {touched.email && isEmailValid && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Valid format
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="ada@computing.org"
                required
                className={`w-full pl-10 pr-9 py-2.5 min-h-[44px] text-xs rounded-xl glass-input text-white ${
                  touched.email && !isEmailValid ? 'border-red-500/60 focus:border-red-500' : ''
                }`}
              />
              {touched.email && isEmailValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
            {touched.email && !isEmailValid && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" /> Enter a valid email (e.g. dev@company.com).
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">Password</label>
              {touched.password && isPasswordValid && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Secure
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="At least 6 characters"
                required
                className={`w-full pl-10 pr-9 py-2.5 min-h-[44px] text-xs rounded-xl glass-input text-white ${
                  touched.password && !isPasswordValid ? 'border-red-500/60 focus:border-red-500' : ''
                }`}
              />
              {touched.password && isPasswordValid && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              )}
            </div>
            {touched.password && !isPasswordValid && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" /> Password must be at least 6 characters.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer flex items-center justify-center"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link
            href={redirectParam ? `/auth/login?redirect=${encodeURIComponent(redirectParam)}` : '/auth/login'}
            className="text-amber-400 font-semibold hover:underline"
          >
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto my-12 text-center text-gray-400 text-xs">
          Loading registration form...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
