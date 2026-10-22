import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 text-gray-300">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4" /> Global Privacy Standard
        </div>
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-gray-400">
          Effective Date: October 23, 2026 • Compliant with GDPR, CCPA, and Global Telemetry Standards
        </p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">1. Introduction &amp; Commitment</h2>
        <p>
          Code &amp; Coffee (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) respects the privacy and sovereignty of our developer community.
          This Privacy Policy governs the collection, processing, and storage of data across our website and REST APIs.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-400">
          <li>
            <strong className="text-gray-200">Account Credentials:</strong> Name, email address, password hash (salted using bcrypt with cost factor 10), and optional bio information.
          </li>
          <li>
            <strong className="text-gray-200">OAuth2 Profile Data:</strong> When signing in through Google or GitHub OAuth, we receive authorized public profile identifiers and verified email addresses.
          </li>
          <li>
            <strong className="text-gray-200">Real-Time Reader Telemetry:</strong> Ephemeral sliding-window reader tokens processed via Redis with 25-second auto-expiration (TTL) to measure active readers without persistent user tracking.
          </li>
        </ul>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">3. Data Storage &amp; Encryption</h2>
        <p>
          All persistent relational records are housed within Neon Serverless PostgreSQL with mandatory SSL transport encryption (<code className="text-amber-400 font-mono">sslmode=require</code>).
          Password hashes are one-way cryptographic digests. Sensitive verification OTP tokens expire within 10 minutes and are purged from database records upon use.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">4. Your Rights Under GDPR &amp; CCPA</h2>
        <p>
          You retain the unconditional right to access, rectify, export, or permanently erase your user account and associated comments from our database at any time.
          Inquiries regarding data deletion requests may be directed to <span className="text-amber-400 font-mono">privacy@codeandcoffee.dev</span>.
        </p>
      </section>
    </div>
  );
}
