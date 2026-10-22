import React from 'react';
import { BookOpen } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-8 text-gray-300">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> Legal Agreement
        </div>
        <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="text-xs text-gray-400">
          Last Revised: October 2026 • Code &amp; Coffee Media Inc.
        </p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or utilizing Code &amp; Coffee (&quot;the Platform&quot;), you acknowledge that you have read, understood,
          and agree to be bound by these Terms of Service. If you do not accept these terms, you must discontinue platform use.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">2. Content Authorship &amp; Permissions</h2>
        <p>
          To maintain technical integrity and prevent promotional spam, publishing rights on Code &amp; Coffee are strictly
          restricted to verified Administrator accounts. Viewers and registered community members may participate through comments,
          discussion feedback, and article reactions (likes and dislikes).
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">3. Community Conduct &amp; Account Suspension</h2>
        <p>
          Discussion comments must remain constructive, civil, and professional. The platform administrators reserve the right
          to moderate, redact, or permanently suspend any account engaging in abusive conduct, automated scraping, or denial-of-service activity.
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-bold text-white">4. Intellectual Property</h2>
        <p>
          All published engineering deep-dives, architectural diagrams, and proprietary source snippets are protected under
          international copyright laws. Code examples shared for educational purposes are provided under the MIT License unless stated otherwise.
        </p>
      </section>
    </div>
  );
}
