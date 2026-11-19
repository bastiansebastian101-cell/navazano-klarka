import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { CatalogGrid } from '@/components/shop/CatalogGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Katalog kytic a květin — rozvoz po Českých Budějovicích | Navázáno by Klára',
  description: 'Kytice a květiny z květinářství Navázáno v Českých Budějovicích. Ručně vázané kytice a květinové dárky s rozvozem zdarma — objednejte online.',
};

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ position: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
    include: { variants: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <CatalogGrid products={products} />
    </div>
  );
}
