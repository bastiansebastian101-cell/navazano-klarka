import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/ucet'],
      },
    ],
    sitemap: 'https://navazano.cz/sitemap.xml',
  };
}
