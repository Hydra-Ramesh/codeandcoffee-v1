/**
 * Security Utility: Server-Side String & HTML Sanitization
 * Strips executable HTML tags, JavaScript event handlers, and malicious injections.
 */

export function sanitizeText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove script tags and their inner content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove inline event handlers (e.g. onload=, onclick=)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    // Strip HTML markup
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();
}

export function sanitizeBio(bio: string | undefined | null): string {
  return sanitizeText(bio);
}
