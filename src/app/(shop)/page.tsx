import { prisma } from '@/lib/db';
import { Hero } from '@/components/shop/Hero';
import { FeaturedSection } from '@/components/shop/FeaturedSection';
import { ReviewsMarquee } from '@/components/shop/ReviewsMarquee';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, reviews] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featuredOnHome: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
    prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);

  return (
    <div>
      <Hero />
      {featured.length > 0 && <FeaturedSection products={featured} />}
      <ReviewsMarquee reviews={reviews} />
    </div>
  );
}
