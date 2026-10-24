'use client';

import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { fetchApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypotTrap, setHoneypotTrap] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (honeypotTrap.trim().length > 0) {
      // Automated bot trapped! Silently succeed without processing
      setSubmitted(true);
      return;
    }

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchApi('/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          honeypot: honeypotTrap,
        }),
      });

      if (res.success) {
        setSubmitted(true);
        success('Your inquiry has been dispatched to our engineering staff!');
      } else {
        setErrorMsg(res.message || 'Could not dispatch inquiry. Please check your details and try again.');
        toastError(res.message || 'Transmission failed.');
      }
    } catch {
      setErrorMsg('An unexpected network error occurred. Please try again.');
      toastError('Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-12">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Connect with the <span className="gradient-text-amber">Engineering Staff</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Have an architectural question, technical feedback, or a security inquiry? We welcome dialogue with the developer community.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            Send an Inquiry
          </h2>

          {submitted ? (
            <div className="p-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Message Dispatched!</h3>
              <p className="text-xs text-gray-300 max-w-md mx-auto">
                Thank you, {name}. Our engineering staff reviews all inquiries and will reply within our standard 24-hour SLA.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Anti-Bot Honeypot Trap */}
              <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                <label htmlFor="contact_website_trap">Website</label>
                <input
                  id="contact_website_trap"
                  type="text"
                  name="website_trap"
                  value={honeypotTrap}
                  onChange={(e) => setHoneypotTrap(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Linus Torvalds"
                    required
                    className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="linus@kernel.org"
                    required
                    className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Distributed consensus algorithms or editorial feedback"
                  required
                  className="w-full px-4 py-2.5 text-xs rounded-xl glass-input text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Technical Details / Inquiry Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Describe your inquiry with context or reproduction steps..."
                  required
                  className="w-full px-4 py-3 text-xs rounded-xl glass-input text-white resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transmitting Inquiry...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Transmit Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Global Addresses & Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Registered Office */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Building className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Headquarters &amp; Registered Office
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Code &amp; Coffee<br />
              Khejuri, East Medinipur<br />
              West Bengal, India, 721430
            </p>
            <div className="pt-2 border-t border-white/5 space-y-1">
              <span className="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                Official Email
              </span>
              <a
                href="mailto:codeandcoffee2024@gmail.com"
                className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-mono inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                codeandcoffee2024@gmail.com
              </a>
            </div>
          </div>

          {/* Editorial & Community Contact */}
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-purple-400">
              <MapPin className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Editorial &amp; Author Inquiries
              </h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Looking to contribute technical articles, submit guest engineering case studies, or report site feedback?
            </p>
            <div className="text-xs text-purple-400 font-mono pt-1">
              <a
                href="mailto:codeandcoffee2024@gmail.com"
                className="hover:underline inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                codeandcoffee2024@gmail.com
              </a>
            </div>
          </div>

          {/* SLA & Security Trust */}
          <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Security Vulnerability Disclosure
            </div>
            <p className="text-gray-400 leading-relaxed">
              For responsible security disclosures, reports can be sent directly to{' '}
              <a href="mailto:codeandcoffee2024@gmail.com" className="text-amber-400 hover:underline font-mono">
                codeandcoffee2024@gmail.com
              </a>.
            </p>
            <div className="flex items-center gap-1.5 text-gray-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Average editorial response time: &lt; 24 hours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
