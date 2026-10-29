/**
 * Image Delivery Optimization Utility for Code & Coffee
 * Injects automatic WebP/AVIF formatting, quality compression, and responsive dimensions
 * Works seamlessly with Cloudinary and Unsplash URLs
 */
export function optimizeImageUrl(
  url?: string | null,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'limit' | 'scale';
  } = {}
): string {
  if (!url) return '';

  // Automatically rewrite local upload URLs to production backend on HTTPS to prevent Mixed Content warnings
  if (url.startsWith('http://localhost:5000') || url.startsWith('http://127.0.0.1:5000')) {
    const isHttps =
      typeof window !== 'undefined'
        ? window.location.protocol === 'https:'
        : process.env.NODE_ENV === 'production';
    if (isHttps) {
      url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, 'https://codeandcoffee-v1.onrender.com');
    }
  }

  if (url.startsWith('image_')) {
    url = `/uploads/${url}`;
  }
  if (url.startsWith('/uploads/')) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'https://codeandcoffee-v1.onrender.com';
    url = `${backendUrl}${url}`;
  }

  const { width, height, crop = 'limit' } = options;

  // Cloudinary Optimization
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const transforms: string[] = ['f_auto', 'q_auto'];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);

    const transformString = transforms.join(',');

    // Avoid double transformation injection
    if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) {
      return url;
    }

    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  // Unsplash Optimization
  if (url.includes('images.unsplash.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('auto', 'format');
    urlObj.searchParams.set('fit', 'crop');
    urlObj.searchParams.set('q', '80');
    if (width) urlObj.searchParams.set('w', String(width));
    if (height) urlObj.searchParams.set('h', String(height));
    return urlObj.toString();
  }

  return url;
}
