'use client';

import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { DELIVERY_WINDOW_LABELS_CS } from '@/lib/delivery-labels';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: { include: { product: true } } } }>;

export function OrderConfirmation({
  order,
  iban,
  qrDataUrl,
}: {
  order: OrderWithItems;
  iban: string | null;
  qrDataUrl: string | null;
}) {
  const { language, t } = useLanguage();

  const windowLabel = DELIVERY_WINDOW_LABELS_CS[order.deliveryWindow] ?? order.deliveryWindow;
  const dateLabel = order.deliveryDate.toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-GB');

  return (
    <div className="text-center">
      <div className="text-5xl mb-4">💐</div>
      <h1 className="font-display text-3xl text-ink">{t.confirmation.title}</h1>
      <p className="mt-2 text-ink-light">
        {t.confirmation.orderNumber}: <span className="font-mono">#{order.orderNumber}</span>
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
          <p className="text-sm text-ink mb-4">{t.confirmation.bankTransferInfo}</p>
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <dl className="flex-1 w-full space-y-2 text-sm">
              <div className="flex justify-between sm:block">
                <dt className="text-ink-light">{t.confirmation.accountNumber}</dt>
                <dd className="font-mono font-semibold text-ink">{iban ?? '—'}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-ink-light">{t.confirmation.variableSymbol}</dt>
                <dd className="font-mono font-semibold text-ink">{order.orderNumber}</dd>
              </div>
              <div className="flex justify-between sm:block">
                <dt className="text-ink-light">{t.confirmation.amount}</dt>
                <dd className="font-mono font-semibold text-brand">{formatCzk(order.totalCzk)}</dd>
              </div>
            </dl>
            {qrDataUrl && (
              <div className="flex-shrink-0 text-center">
                <p className="text-xs text-ink-light mb-1 uppercase tracking-wide">{t.confirmation.qrPayment}</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR platba" width={160} height={160} className="rounded-lg border border-ink-lighter/20 bg-white p-2" />
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-ink-light bg-white/60 rounded-lg p-3">{t.confirmation.exactAmountWarning}</p>
        </div>
      ) : (
        <div className="mt-6 bg-brand-light rounded-2xl p-6 text-left">
          <p className="text-sm text-ink">{t.confirmation.cashOnDeliveryInfo}</p>
        </div>
      )}

      <p className="mt-8 text-sm text-ink-light">
        {language === 'cs' ? (
          <>
            Uložili jsme vaše údaje, abyste mohli sledovat historii objednávek. Přihlaste se na{' '}
            <Link href="/ucet" className="text-brand hover:text-brand-hover font-medium">
              navazano.cz/ucet
            </Link>{' '}
            pomocí e-mailu {order.email}.
          </>
        ) : (
          <>
            We&apos;ve saved your details so you can track your order history. Log in at{' '}
            <Link href="/ucet" className="text-brand hover:text-brand-hover font-medium">
              navazano.cz/ucet
            </Link>{' '}
            using {order.email}.
          </>
        )}
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold px-8 py-3 rounded-full transition-colors"
      >
        {t.confirmation.backHome}
      </Link>
    </div>
  );
}
