import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, createdAt: true },
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://navazano.cz/', changeFrequency: 'daily', priority: 1 },
    { url: 'https://navazano.cz/katalog', changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://navazano.cz/o-nas', changeFrequency: 'monthly', priority: 0.6 },
    { url: 'https://navazano.cz/kancelare', changeFrequency: 'monthly', priority: 0.7 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url: `https://navazano.cz/produkt/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
