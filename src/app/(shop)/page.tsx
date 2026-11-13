import { prisma } from '@/lib/db';
import { Hero } from '@/components/shop/Hero';
import { FeaturedSection } from '@/components/shop/FeaturedSection';
import { ReviewsMarquee } from '@/components/shop/ReviewsMarquee';
import { HomeSeo } from '@/components/shop/HomeSeo';
import { cs } from '@/translations/cs';

// FAQ as structured data, so Google can show the questions directly in search results.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: cs.home.faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [featured, reviews] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featuredOnHome: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { variants: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);

  return (
    <div>
      <Hero />
      {featured.length > 0 && <FeaturedSection products={featured} />}
      <ReviewsMarquee reviews={reviews} />
      <HomeSeo />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </div>
  );
}
