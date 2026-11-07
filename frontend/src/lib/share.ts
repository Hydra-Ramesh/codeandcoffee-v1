/**
 * Unified share utility for Code & Coffee
 * Uses Web Share API when supported on mobile/modern browsers,
 * with seamless fallback to clipboard copying.
 */
export async function shareLink(options: {
  title: string;
  text?: string;
  url: string;
  onSuccess?: (msg: string) => void;
}): Promise<boolean> {
  const fullUrl =
    typeof window !== 'undefined'
      ? options.url.startsWith('http')
        ? options.url
        : `${window.location.origin}${options.url.startsWith('/') ? '' : '/'}${options.url}`
      : options.url;

  // Attempt Web Share API first (Mobile, macOS Safari, etc.)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options.title,
        text: options.text || options.title,
        url: fullUrl,
      });
      options.onSuccess?.('Shared successfully!');
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false; // User cancelled share sheet
      }
      // If Web Share fails for permission/support reason, fallback to clipboard
    }
  }

  // Fallback: Copy to Clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(fullUrl);
      options.onSuccess?.('Link copied to clipboard!');
      return true;
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  }

  return false;
}
