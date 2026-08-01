import { prisma } from '@/lib/db';
import { Hero } from '@/components/shop/Hero';
import { FeaturedSection } from '@/components/shop/FeaturedSection';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  return (
    <div>
      <Hero />
      {featured.length > 0 && <FeaturedSection products={featured} />}
    </div>
  );
}
