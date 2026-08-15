'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product, ProductVariant } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';
import { ImageGallery } from '@/components/shop/ImageGallery';
import { ShareButton } from '@/components/shop/ShareButton';

type ProductWithVariants = Product & { variants: ProductVariant[] };

export function ProductDetail({ product }: { product: ProductWithVariants }) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  const activeVariants = product.variants.filter((v) => v.active);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(activeVariants[0]?.id ?? null);
  const selectedVariant = activeVariants.find((v) => v.id === selectedVariantId) ?? null;

  const name = language === 'cs' ? product.nameCs : product.nameEn;
  const description = language === 'cs' ? product.descriptionCs : product.descriptionEn;
  const displayPriceCzk = selectedVariant ? selectedVariant.priceCzk : product.priceCzk;

  return (
    <div>
      <Link href="/katalog" className="text-sm text-brand hover:text-brand-hover">
        ← {t.product.back}
      </Link>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square bg-sage-light rounded-2xl overflow-hidden relative">
          <ImageGallery images={product.imageUrls} alt={name} size="detail" />
        </div>
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl text-ink">{name}</h1>
            <ShareButton productId={product.id} variant="labeled" className="mt-1 shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-ink-light hover:text-brand transition-colors" />
          </div>
          <p className="mt-2 text-2xl text-brand font-semibold">{formatCzk(displayPriceCzk)}</p>
          <p className="mt-6 text-ink-light leading-relaxed">{description}</p>

          {activeVariants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-ink mb-2">{t.product.chooseVariant}</p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      selectedVariantId === v.id
                        ? 'bg-brand text-white border-brand'
                        : 'bg-white text-ink-light border-ink-lighter/30 hover:border-brand hover:text-brand'
                    }`}
                  >
                    {v.label} — {formatCzk(v.priceCzk)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() =>
              addItem({
                productId: product.id,
                variantId: selectedVariant?.id ?? null,
                variantLabel: selectedVariant?.label ?? null,
                nameCs: product.nameCs,
                nameEn: product.nameEn,
                priceCzk: displayPriceCzk,
                imageUrl: product.imageUrls[0] ?? null,
              })
            }
            className="mt-8 w-full sm:w-auto bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3 rounded-full transition-colors"
          >
            {t.catalog.addToCart}
          </button>
        </div>
      </div>
    </div>
  );
}
