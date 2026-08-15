import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ProductDetail } from '@/components/shop/ProductDetail';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
  });
  if (!product || !product.active) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <ProductDetail product={product} />
    </div>
  );
}
