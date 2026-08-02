'use client';

import Link from 'next/link';
import type { Product } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';
import { ImageGallery } from '@/components/shop/ImageGallery';

export function ProductDetail({ product }: { product: Product }) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  const name = language === 'cs' ? product.nameCs : product.nameEn;
  const description = language === 'cs' ? product.descriptionCs : product.descriptionEn;

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
          <h1 className="font-display text-3xl text-ink">{name}</h1>
          <p className="mt-2 text-2xl text-brand font-semibold">{formatCzk(product.priceCzk)}</p>
          <p className="mt-6 text-ink-light leading-relaxed">{description}</p>
          <button
            onClick={() =>
              addItem({
                productId: product.id,
                nameCs: product.nameCs,
                nameEn: product.nameEn,
                priceCzk: product.priceCzk,
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
