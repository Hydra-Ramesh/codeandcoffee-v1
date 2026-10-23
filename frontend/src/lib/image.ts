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
