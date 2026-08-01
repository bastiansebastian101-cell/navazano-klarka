'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  const name = language === 'cs' ? product.nameCs : product.nameEn;

  return (
    <div className="group rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-shadow overflow-hidden">
      <Link href={`/produkt/${product.id}`} className="block aspect-square bg-sage-light relative overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
        )}
      </Link>
      <div className="p-5">
        <Link href={`/produkt/${product.id}`}>
          <h3 className="font-display text-lg text-ink hover:text-brand transition-colors">{name}</h3>
        </Link>
        <p className="mt-1 text-brand font-semibold">{formatCzk(product.priceCzk)}</p>
        <button
          onClick={() =>
            addItem({
              productId: product.id,
              nameCs: product.nameCs,
              nameEn: product.nameEn,
              priceCzk: product.priceCzk,
              imageUrl: product.imageUrl,
            })
          }
          className="mt-4 w-full bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
        >
          {t.catalog.addToCart}
        </button>
      </div>
    </div>
  );
}
