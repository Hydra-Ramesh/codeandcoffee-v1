'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { fetchApi } from '../../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetchApi('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (res.success) {
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } else {
      setError(res.message || 'Failed to dispatch verification email.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-14">
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-xs text-gray-400">
            Enter your email to receive a 6-digit OTP verification code via Google SMTP.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {loading ? 'Dispatching OTP Code...' : 'Send 6-Digit OTP'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
