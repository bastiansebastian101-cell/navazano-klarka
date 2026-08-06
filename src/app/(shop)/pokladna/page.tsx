'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';
import { DELIVERY_WINDOWS, earliestDeliveryDate, type DeliveryWindow } from '@/lib/delivery';

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface AppliedCoupon {
  code: string;
  discountCzk: number;
  newTotalCzk: number;
}

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { items, totalCzk, clear } = useCart();
  const router = useRouter();

  const minDate = useMemo(() => toDateInputValue(earliestDeliveryDate()), []);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(minDate);
  const [deliveryWindow, setDeliveryWindow] = useState<DeliveryWindow>(DELIVERY_WINDOWS[0]);
  const [notes, setNotes] = useState('');
  const [occasionReason, setOccasionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const couponReasonMessage = (reason: string) => {
    switch (reason) {
      case 'expired':
        return t.checkout.couponExpired;
      case 'exhausted':
        return t.checkout.couponExhausted;
      case 'inactive':
      case 'not_found':
      default:
        return t.checkout.couponInvalid;
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim(), subtotalCzk: totalCzk }),
      });
      const data = await res.json();
      if (!data.valid) {
        setAppliedCoupon(null);
        setCouponError(couponReasonMessage(data.reason));
      } else {
        setAppliedCoupon({ code: couponInput.trim(), discountCzk: data.discountCzk, newTotalCzk: data.newTotalCzk });
      }
    } catch {
      setCouponError(t.checkout.couponInvalid);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-ink-light mb-8">{t.cart.empty}</p>
        <Link href="/katalog" className="inline-flex items-center bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-full transition-colors">
          {t.cart.continueShopping}
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          phone,
          email,
          deliveryAddress,
          deliveryDate: new Date(deliveryDate).toISOString(),
          deliveryWindow,
          paymentMethod: 'bank_transfer',
          notes,
          occasionReason,
          couponCode: appliedCoupon?.code,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'invalid_delivery_date') {
          setError(t.checkout.cutoffError);
        } else if (data.error === 'invalid_coupon') {
          setAppliedCoupon(null);
          setCouponError(couponReasonMessage(data.reason));
          setError(t.checkout.couponInvalid);
        } else {
          setError(t.checkout.genericError);
        }
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      clear();
      router.push(`/objednavka/${data.orderId}/potvrzeni`);
    } catch {
      setError(t.checkout.genericError);
      setSubmitting(false);
    }
  };

  const finalTotal = appliedCoupon ? appliedCoupon.newTotalCzk : totalCzk;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        <h1 className="font-display text-3xl text-ink">{t.checkout.title}</h1>

        <div>
          <h2 className="font-medium text-ink mb-3">{t.checkout.contactInfo}</h2>
          <div className="space-y-3">
            <input
              required
              placeholder={t.checkout.name}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
            />
            <input
              required
              type="tel"
              placeholder={t.checkout.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
            />
            <input
              required
              type="email"
              placeholder={t.checkout.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
            />
          </div>
        </div>

        <div>
          <h2 className="font-medium text-ink mb-3">{t.checkout.deliveryAddress}</h2>
          <textarea
            required
            rows={2}
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
          <p className="mt-1.5 text-xs text-ink-lighter">{t.footer.deliveryArea}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">{t.checkout.deliveryDate}</label>
            <input
              required
              type="date"
              min={minDate}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">{t.checkout.deliveryWindow}</label>
            <select
              value={deliveryWindow}
              onChange={(e) => setDeliveryWindow(e.target.value as DeliveryWindow)}
              className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
            >
              <option value="9-12">{t.checkout.windowMorning}</option>
              <option value="12-15">{t.checkout.windowAfternoon}</option>
              <option value="15-18">{t.checkout.windowEvening}</option>
            </select>
          </div>
        </div>

        <div>
          <h2 className="font-medium text-ink mb-3">{t.checkout.paymentMethod}</h2>
          <p className="text-sm text-ink-light bg-brand-light rounded-lg px-4 py-2.5">{t.checkout.bankTransfer}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">{t.checkout.notes}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">{t.checkout.occasionReason}</label>
          <input
            placeholder={t.checkout.occasionReasonPlaceholder}
            value={occasionReason}
            onChange={(e) => setOccasionReason(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold py-3.5 rounded-full transition-colors"
        >
          {submitting ? t.checkout.submitting : t.checkout.submit}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-card p-6 h-fit">
        <h2 className="font-medium text-ink mb-4">{t.checkout.orderSummary}</h2>
        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between">
              <span className="text-ink-light">
                {item.nameCs} × {item.quantity}
              </span>
              <span className="text-ink">{formatCzk(item.priceCzk * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-ink-lighter/20">
          {appliedCoupon ? (
            <div className="flex items-center justify-between text-sm bg-sage-light rounded-lg px-3 py-2">
              <span className="text-ink">
                {t.checkout.couponApplied}: <span className="font-mono font-semibold">{appliedCoupon.code}</span>
              </span>
              <button type="button" onClick={handleRemoveCoupon} className="text-ink-light hover:text-brand text-xs">
                {t.checkout.couponRemove}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                placeholder={t.checkout.couponCode}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 min-w-0 border border-ink-lighter/30 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon || !couponInput.trim()}
                className="flex-shrink-0 bg-ink text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {t.checkout.couponApply}
              </button>
            </div>
          )}
          {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
        </div>

        {appliedCoupon && (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-ink-light">
              <span>{t.checkout.subtotal}</span>
              <span>{formatCzk(totalCzk)}</span>
            </div>
            <div className="flex justify-between text-sage-dark">
              <span>{t.checkout.discount}</span>
              <span>−{formatCzk(appliedCoupon.discountCzk)}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4 pt-4 border-t border-ink-lighter/20 font-semibold">
          <span>{t.cart.total}</span>
          <span className="text-brand">{formatCzk(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}
