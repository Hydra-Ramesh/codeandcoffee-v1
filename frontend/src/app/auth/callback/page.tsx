'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Coffee, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getSafeRedirectUrl } from '../../../lib/security';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSessionFromToken } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(error));
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token received from provider.');
      return;
    }

    // Authorize session with token
    setSessionFromToken(token)
      .then((success) => {
        if (success) {
          setStatus('success');
          const rawRedirect =
            searchParams.get('redirect') ||
            (typeof window !== 'undefined' ? sessionStorage.getItem('auth_redirect') : null);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('auth_redirect');
          }
          const safeRedirect = getSafeRedirectUrl(rawRedirect, '/blogs');
          setTimeout(() => {
            router.push(safeRedirect);
          }, 800);
        } else {
          setStatus('error');
          setErrorMessage('Failed to verify user session with the platform.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred during authorization.');
      });
  }, [searchParams, router, setSessionFromToken]);

  return (
    <div className="max-w-md mx-auto my-16">
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Coffee className={`w-8 h-8 ${status === 'loading' ? 'animate-pulse' : ''}`} />
        </div>

        {status === 'loading' && (
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-white">Authorizing Account</h1>
            <p className="text-xs text-gray-400">Securely verifying your credentials with Code &amp; Coffee...</p>
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Authentication Successful!</span>
            </div>
            <h1 className="text-xl font-bold text-white">Welcome Back</h1>
            <p className="text-xs text-gray-400">Redirecting you to the journal now...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-red-400 text-sm font-semibold">
              <AlertCircle className="w-5 h-5" />
              <span>Sign-In Failed</span>
            </div>
            <p className="text-xs text-gray-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {errorMessage}
            </p>
            <div className="pt-2">
              <Link
                href="/auth/login"
                className="inline-block py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto my-16 text-center text-gray-400 text-xs">
          Loading authentication handler...
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
