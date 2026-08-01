'use client';

import { useRouter } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { DELIVERY_WINDOW_LABELS_CS } from '@/lib/delivery-labels';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: { include: { product: true } } } }>;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function OrderHistory({ customerEmail, orders }: { customerEmail: string; orders: OrderWithItems[] }) {
  const { language, t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl text-ink">{t.account.orderHistoryTitle}</h1>
        <button onClick={handleLogout} className="text-sm text-ink-light hover:text-brand">
          {t.account.logout}
        </button>
      </div>
      <p className="text-sm text-ink-light mb-8">{customerEmail}</p>

      {orders.length === 0 ? (
        <p className="text-ink-light">{t.account.noOrders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">#{order.orderNumber}</p>
                  <p className="text-sm text-ink-light">
                    {order.deliveryDate.toLocaleDateString(language === 'cs' ? 'cs-CZ' : 'en-GB')},{' '}
                    {DELIVERY_WINDOW_LABELS_CS[order.deliveryWindow] ?? order.deliveryWindow}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand">{formatCzk(order.totalCzk)}</p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                  >
                    {t.admin.orderStatus[order.status as keyof typeof t.admin.orderStatus] ?? order.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-sm text-ink-light">
                {order.items.map((item) => (
                  <span key={item.id} className="mr-3">
                    {(language === 'cs' ? item.product.nameCs : item.product.nameEn)} × {item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
