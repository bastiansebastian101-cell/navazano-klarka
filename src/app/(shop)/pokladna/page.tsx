'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { formatCzk } from '@/lib/format';
import { DELIVERY_WINDOWS, earliestDeliveryDate, type DeliveryWindow } from '@/lib/delivery';
import type { ActivePromo } from '@/lib/promoBanner';

// Calendar date as YYYY-MM-DD (not via toISOString, which shifts to UTC and
// shows the previous day for Czech visitors).
function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  // Pre-order items in the cart (e.g. Christmas bouquets) push the earliest date out.
  const prepDays = items.reduce((max, i) => Math.max(max, i.prepDays ?? 0), 0);
  const minDate = useMemo(() => toDateInputValue(earliestDeliveryDate(new Date(), prepDays)), [prepDays]);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(minDate);
  // The cart loads from storage after the first render — keep the picked date valid.
  useEffect(() => {
    setDeliveryDate((d) => (d < minDate ? minDate : d));
  }, [minDate]);
  const [deliveryWindow, setDeliveryWindow] = useState<DeliveryWindow>(DELIVERY_WINDOWS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash_on_delivery' | 'card'>('bank_transfer');
  // Card / Google Pay / Apple Pay is offered only when a payment gateway is configured.
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  useEffect(() => {
    fetch('/api/payment-methods', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { online: false }))
      .then((d) => {
        if (d.online) {
          setOnlineEnabled(true);
          setPaymentMethod('card'); // fastest way to pay — preselect it
        }
      })
      .catch(() => {});
  }, []);
  const [termsAccepted, setTermsAccepted] = useState(false);
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

  // The offer currently advertised in the top promo bar (if any), for one-click apply.
  const [promo, setPromo] = useState<ActivePromo | null>(null);
  useEffect(() => {
    fetch('/api/promo-banner', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { promo: null }))
      .then((d) => setPromo(d.promo ?? null))
      .catch(() => {});
  }, []);
  const promoSavingCzk = promo
    ? promo.discountType === 'percentage'
      ? Math.round((totalCzk * promo.discountValue) / 100)
      : Math.min(promo.discountValue, totalCzk)
    : 0;

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponInput).trim();
    if (!code) return;
    if (codeOverride) setCouponInput(codeOverride);
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalCzk: totalCzk }),
      });
      const data = await res.json();
      if (!data.valid) {
        setAppliedCoupon(null);
        setCouponError(couponReasonMessage(data.reason));
      } else {
        setAppliedCoupon({ code, discountCzk: data.discountCzk, newTotalCzk: data.newTotalCzk });
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
          paymentMethod,
          termsAccepted,
          notes,
          occasionReason,
          couponCode: appliedCoupon?.code,
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
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
        } else if (data.error === 'payment_unavailable') {
          setError(t.checkout.onlineUnavailable);
        } else {
          setError(t.checkout.genericError);
        }
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      clear();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl; // GoPay payment page
        return;
      }
      router.push(`/objednavka/${data.orderId}/potvrzeni`);
    } catch {
      setError(t.checkout.genericError);
      setSubmitting(false);
    }
  };

  const finalTotal = appliedCoupon ? appliedCoupon.newTotalCzk : totalCzk;
  const promoApplied = !!promo && appliedCoupon?.code.toUpperCase() === promo.code;
  const showPromoOffer = !!promo && promoSavingCzk > 0 && !promoApplied;

  const promoOfferButton = (big: boolean) => (
    <button
      type="button"
      onClick={() => promo && handleApplyCoupon(promo.code)}
      disabled={applyingCoupon}
      className={`shine relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-full bg-ink text-white font-semibold shadow-card hover:bg-ink/90 disabled:opacity-60 transition-colors ${
        big ? 'w-full sm:w-auto px-6 py-3' : 'px-4 py-2 text-sm'
      }`}
    >
      🎁 {t.checkout.promoApply.replace('{amount}', formatCzk(promoSavingCzk))}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
      <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
        <h1 className="font-display text-3xl text-ink">{t.checkout.title}</h1>

        {showPromoOffer && (
          <div className="rounded-2xl border-2 border-dashed border-brand bg-brand-light p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <div className="flex-1">
              <p className="font-display text-lg text-ink">
                {t.checkout.promoTitle.replace('{amount}', formatCzk(promoSavingCzk))}
              </p>
              <p className="text-sm text-ink-light">
                {t.checkout.promoSubtitle
                  .replace('{code}', promo!.code)
                  .replace('{total}', formatCzk(totalCzk - promoSavingCzk))}
              </p>
            </div>
            {promoOfferButton(true)}
          </div>
        )}
        {promoApplied && appliedCoupon && (
          <div className="rounded-2xl bg-sage-light text-sage-dark px-4 py-3 text-sm font-semibold">
            ✓ {t.checkout.promoApplied.replace('{amount}', formatCzk(appliedCoupon.discountCzk))}
          </div>
        )}

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
          <div
            className={`grid gap-2 ${onlineEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
            role="radiogroup"
            aria-label={t.checkout.paymentMethod}
          >
            {(
              [
                ...(onlineEnabled ? [{ value: 'card', label: t.checkout.onlinePayment, icon: '💳' } as const] : []),
                { value: 'bank_transfer', label: t.checkout.bankTransfer, icon: '🏦' } as const,
                { value: 'cash_on_delivery', label: t.checkout.cashOnDelivery, icon: '💵' } as const,
              ]
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  paymentMethod === opt.value
                    ? 'border-brand bg-brand-light text-ink'
                    : 'border-ink-lighter/30 text-ink-light hover:border-brand/50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                  className="accent-brand"
                />
                <span aria-hidden="true">{opt.icon}</span>
                {opt.label}
              </label>
            ))}
          </div>
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

        <label className="flex items-start gap-3 text-sm text-ink cursor-pointer">
          <input
            type="checkbox"
            required
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand flex-shrink-0"
          />
          <span>
            {t.checkout.termsAgreePrefix}{' '}
            <Link href="/obchodni-podminky" target="_blank" className="text-brand underline">
              {t.checkout.termsLink}
            </Link>{' '}
            {t.checkout.termsAgreeMiddle}{' '}
            <Link href="/ochrana-osobnich-udaju" target="_blank" className="text-brand underline">
              {t.checkout.privacyLink}
            </Link>
            .
          </span>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {showPromoOffer && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-ink-light">
            <span>{t.checkout.promoReminder}</span>
            {promoOfferButton(false)}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold py-3.5 rounded-full transition-colors"
        >
          {submitting
            ? t.checkout.submitting
            : appliedCoupon && appliedCoupon.discountCzk > 0
              ? `${t.checkout.submit} · ${t.checkout.youSave.replace('{amount}', formatCzk(appliedCoupon.discountCzk))}`
              : t.checkout.submit}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-card p-6 h-fit">
        <h2 className="font-medium text-ink mb-4">{t.checkout.orderSummary}</h2>
        <div className="space-y-2 text-sm">
          {items.map((item) => (
            <div key={`${item.productId}:${item.variantId ?? ''}`} className="flex justify-between">
              <span className="text-ink-light">
                {item.nameCs}
                {item.variantLabel && ` (${item.variantLabel})`} × {item.quantity}
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
                onClick={() => handleApplyCoupon()}
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
