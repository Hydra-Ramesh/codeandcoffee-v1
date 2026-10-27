/**
 * Security & Sanitization Utilities for Code & Coffee Frontend
 */

/**
 * Validates and sanitizes internal redirection paths to prevent Open Redirect attacks (CWE-601).
 * Rejects external URLs (http://, https://, protocol-relative //, or backslash /\\).
 */
export function getSafeRedirectUrl(url: string | null | undefined, fallback: string = '/blogs'): string {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  
  // Must start with a single forward slash and cannot start with // or /\\ (common browser open redirect bypasses)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    // Ensure no control characters or newlines
    if (/[\r\n\t]/.test(trimmed)) {
      return fallback;
    }
    return trimmed;
  }
  
  return fallback;
}
