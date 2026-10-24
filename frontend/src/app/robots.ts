import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://codeandcoffee.live';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/auth/reset-password'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
