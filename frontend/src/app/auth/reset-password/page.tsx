'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { fetchApi } from '../../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await fetchApi('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        newPassword,
      }),
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      setError(res.message || 'Failed to reset password. OTP may be invalid or expired.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-14">
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Enter Verification OTP</h1>
          <p className="text-xs text-gray-400">
            Check your inbox (or terminal dev log) for the 6-digit code sent to: <br />
            <strong className="text-white font-mono">{email || 'your email'}</strong>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Password Reset Successfully!</h3>
            <p className="text-xs text-gray-300">Redirecting to sign-in page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                6-Digit Security OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                required
                className="w-full text-center tracking-[8px] font-mono font-bold text-xl py-3 rounded-xl glass-input text-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
              {loading ? 'Verifying & Updating...' : 'Reset Password & Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/auth/login" className="text-xs text-gray-400 hover:text-white transition-colors">
            Cancel and Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400 text-xs">Loading reset page...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
