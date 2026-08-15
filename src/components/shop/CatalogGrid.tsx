'use client';

import { useState } from 'react';
import type { Product, ProductVariant } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProductCard } from '@/components/shop/ProductCard';

export function CatalogGrid({ products }: { products: (Product & { variants: ProductVariant[] })[] }) {
  const { t } = useLanguage();
  const [category, setCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category))).sort()];

  const filtered = category === 'all' ? products : products.filter((p) => p.category === category);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-6">{t.catalog.title}</h1>
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat ? 'bg-brand text-white' : 'bg-white text-ink-light hover:bg-brand-light'
            }`}
          >
            {cat === 'all' ? t.catalog.categories.all : cat}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-ink-light">{t.catalog.empty}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
