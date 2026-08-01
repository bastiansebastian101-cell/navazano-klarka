'use client';

import type { Product } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCard } from '@/components/shop/ProductCard';

export function FeaturedSection({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="font-display text-3xl text-ink">{t.home.featured}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
