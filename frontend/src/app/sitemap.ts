import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://codeandcoffee.live';

  // Base static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/blogs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/whats-coming`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/cookie-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://codeandcoffee-v1.onrender.com/api/v1';
    const res = await fetch(`${apiUrl}/blogs?limit=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    if (data.success && Array.isArray(data.data?.blogs)) {
      const blogRoutes: MetadataRoute.Sitemap = data.data.blogs.map((b: any) => ({
        url: `${baseUrl}/blogs/${b.slug}`,
        lastModified: new Date(b.updatedAt || b.createdAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
      return [...staticRoutes, ...blogRoutes];
    }
  } catch (e) {
    // Fallback if backend is build-time unreachable
  }

  return staticRoutes;
}
