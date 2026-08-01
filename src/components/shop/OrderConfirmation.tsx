'use client';

import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { DELIVERY_WINDOW_LABELS_CS } from '@/lib/delivery-labels';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: { include: { product: true } } } }>;

export function OrderConfirmation({
  order,
  bankAccountNumber,
}: {
  order: OrderWithItems;
  bankAccountNumber: string | null;
}) {
  const { language, t } = useLanguage();

  const windowLabel = DELIVERY_WINDOW_LABELS_CS[order.deliveryWindow] ?? order.deliveryWindow;
  const dateLabel = order.deliveryDate.toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-GB');

  return (
    <div className="text-center">
      <div className="text-5xl mb-4">💐</div>
      <h1 className="font-display text-3xl text-ink">{t.confirmation.title}</h1>
      <p className="mt-2 text-ink-light">
        {t.confirmation.orderNumber}: <span className="font-mono">#{order.id.slice(-8)}</span>
      </p>

      <div className="mt-8 bg-white rounded-2xl shadow-card p-6 text-left">
        <div className="space-y-2 text-sm">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span className="text-ink-light">
                {(language === 'cs' ? item.product.nameCs : item.product.nameEn)} × {item.quantity}
              </span>
              <span className="text-ink">{formatCzk(item.priceCzk * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-ink-lighter/20 font-semibold">
          <span>{t.cart.total}</span>
          <span className="text-brand">{formatCzk(order.totalCzk)}</span>
        </div>
        <p className="mt-4 text-sm text-ink">
          <strong>{t.confirmation.deliveryInfo}:</strong> {dateLabel}, {windowLabel}
        </p>
      </div>

      {order.paymentMethod === 'bank_transfer' ? (
        <div className="mt-6 bg-brand-light rounded-2xl p-6 text-left">
          <p className="text-sm text-ink">{t.confirmation.bankTransferInfo}</p>
          <p className="mt-2 font-mono text-lg text-brand font-semibold">
            {bankAccountNumber ?? '—'}
          </p>
        </div>
      ) : (
        <div className="mt-6 bg-brand-light rounded-2xl p-6 text-left">
          <p className="text-sm text-ink">{t.confirmation.cashOnDeliveryInfo}</p>
        </div>
      )}

      <Link
        href="/"
        className="mt-10 inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3 rounded-full transition-colors"
      >
        {t.confirmation.backHome}
      </Link>
    </div>
  );
}
