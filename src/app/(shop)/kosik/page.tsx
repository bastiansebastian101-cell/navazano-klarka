'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';

export default function CartPage() {
  const { language, t } = useLanguage();
  const { items, setQuantity, removeItem, totalCzk } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-display text-3xl text-ink mb-4">{t.cart.title}</h1>
        <p className="text-ink-light mb-8">{t.cart.empty}</p>
        <Link
          href="/katalog"
          className="inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          {t.cart.continueShopping}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-3xl text-ink mb-8">{t.cart.title}</h1>
      <div className="space-y-4">
        {items.map((item) => {
          const name = language === 'cs' ? item.nameCs : item.nameEn;
          const lineKey = `${item.productId}:${item.variantId ?? ''}`;
          return (
            <div key={lineKey} className="flex items-center gap-4 bg-white rounded-xl shadow-card p-4">
              <div className="w-20 h-20 bg-sage-light rounded-lg overflow-hidden relative flex-shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">
                  {name}
                  {item.variantLabel && <span className="text-ink-light font-normal"> — {item.variantLabel}</span>}
                </p>
                <p className="text-brand font-semibold">{formatCzk(item.priceCzk)}</p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor={`qty-${lineKey}`} className="sr-only">
                  {t.cart.quantity}
                </label>
                <input
                  id={`qty-${lineKey}`}
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => setQuantity(item.productId, item.variantId, parseInt(e.target.value, 10) || 1)}
                  className="w-16 border border-ink-lighter/30 rounded-lg px-2 py-1.5 text-center"
                />
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="text-sm text-ink-light hover:text-brand"
                >
                  {t.cart.remove}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-ink-lighter/20 pt-6">
        <span className="text-lg font-medium text-ink">{t.cart.total}</span>
        <span className="text-2xl font-semibold text-brand">{formatCzk(totalCzk)}</span>
      </div>

      <Link
        href="/pokladna"
        className="mt-8 block text-center bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
      >
        {t.cart.checkout}
      </Link>
    </div>
  );
}
