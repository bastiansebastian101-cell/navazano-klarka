import { prisma } from '@/lib/db';
import { CatalogGrid } from '@/components/shop/CatalogGrid';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CatalogGrid products={products} />
    </div>
  );
}
