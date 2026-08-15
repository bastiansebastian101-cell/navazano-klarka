'use client';

import Link from 'next/link';
import type { Product, ProductVariant } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';
import { ImageGallery } from '@/components/shop/ImageGallery';
import { ShareButton } from '@/components/shop/ShareButton';

type ProductWithVariants = Product & { variants: ProductVariant[] };

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  const name = language === 'cs' ? product.nameCs : product.nameEn;
  const activeVariants = product.variants.filter((v) => v.active);
  const hasVariants = activeVariants.length > 0;
  const fromPriceCzk = hasVariants ? Math.min(...activeVariants.map((v) => v.priceCzk)) : product.priceCzk;

  return (
    <div className="group rounded-3xl bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden">
      <div className="aspect-square bg-sage-light relative overflow-hidden">
        <Link href={`/produkt/${product.id}`} className="absolute inset-0 block">
          <ImageGallery images={product.imageUrls} alt={name} size="card" />
        </Link>
        <span className="absolute top-3 left-3 bg-sage text-white text-xs font-semibold px-3 py-1 rounded-full shadow-card pointer-events-none">
          {t.catalog.categories[product.category as keyof typeof t.catalog.categories] ?? product.category}
        </span>
        <ShareButton
          productId={product.id}
          className="absolute top-3 right-3 bg-white/90 hover:bg-white text-ink-light hover:text-brand rounded-full p-2 shadow-card transition-colors"
        />
      </div>
      <div className="p-5">
        <Link href={`/produkt/${product.id}`}>
          <h3 className="font-display text-lg text-ink hover:text-brand transition-colors">{name}</h3>
        </Link>
        <p className="mt-1 text-brand font-semibold">
          {hasVariants ? `${t.catalog.fromPrice} ${formatCzk(fromPriceCzk)}` : formatCzk(fromPriceCzk)}
        </p>
        {hasVariants ? (
          <Link
            href={`/produkt/${product.id}`}
            className="mt-4 block w-full text-center bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
          >
            {t.catalog.chooseVariant}
          </Link>
        ) : (
          <button
            onClick={() =>
              addItem({
                productId: product.id,
                variantId: null,
                variantLabel: null,
                nameCs: product.nameCs,
                nameEn: product.nameEn,
                priceCzk: product.priceCzk,
                imageUrl: product.imageUrls[0] ?? null,
              })
            }
            className="mt-4 w-full bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
          >
            {t.catalog.addToCart}
          </button>
        )}
      </div>
    </div>
  );
}
