import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://codeandcoffee.live';

  // Base static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/practice`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.95 },
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
    const allBlogs: any[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const res = await fetch(`${apiUrl}/blogs?page=${page}&limit=50`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.blogs)) {
        allBlogs.push(...data.data.blogs);
        totalPages = data.data.pagination?.totalPages || 1;
        page++;
      } else {
        break;
      }
    } while (page <= totalPages && page <= 10);

    if (allBlogs.length > 0) {
      const blogRoutes: MetadataRoute.Sitemap = allBlogs.map((b: any) => ({
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
