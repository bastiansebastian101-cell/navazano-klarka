'use client';

import { useEffect, useState } from 'react';
import type { Prisma } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { DELIVERY_WINDOW_LABELS_CS } from '@/lib/delivery-labels';

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: { include: { product: true } } } }>;

const STATUSES = ['new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'] as const;

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-amber-100 text-amber-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/orders');
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">{t.admin.orders}</h1>

      {loading ? null : orders.length === 0 ? (
        <p className="text-ink-light">{t.admin.noOrders}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    #{order.orderNumber} — {order.customerName}
                  </p>
                  <p className="text-sm text-ink-light">
                    {order.phone} · {order.email}
                  </p>
                  <p className="text-sm text-ink-light">{order.deliveryAddress}</p>
                  <p className="text-sm text-ink-light">
                    {order.deliveryDate.toString().slice(0, 10)},{' '}
                    {DELIVERY_WINDOW_LABELS_CS[order.deliveryWindow] ?? order.deliveryWindow}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand">{formatCzk(order.totalCzk)}</p>
                  <p className="text-xs text-ink-lighter">
                    {order.paymentMethod === 'bank_transfer' ? 'Bankovní převod' : 'Platba při doručení'}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-sm text-ink-light">
                {order.items.map((item) => (
                  <span key={item.id} className="mr-3">
                    {item.product.nameCs} × {item.quantity}
                  </span>
                ))}
              </div>

              {order.notes && <p className="mt-2 text-sm text-ink-light italic">&ldquo;{order.notes}&rdquo;</p>}

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(order.id, status)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-opacity ${
                      STATUS_COLORS[status]
                    } ${order.status === status ? 'opacity-100 ring-2 ring-offset-1 ring-current' : 'opacity-50 hover:opacity-80'}`}
                  >
                    {t.admin.orderStatus[status]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
