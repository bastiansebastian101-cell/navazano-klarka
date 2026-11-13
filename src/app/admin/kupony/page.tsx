'use client';

import { useEffect, useState } from 'react';
import type { Coupon } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { SHOP_TIME_ZONE } from '@/lib/delivery';

/** Offset of Czech time from UTC (ms) at a given instant. */
function pragueOffsetMs(ts: number): number {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ts));
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - Math.floor(ts / 60000) * 60000;
}

/** "2026-11-20T18:00" typed as Czech time -> ISO instant, whatever the admin's own timezone is. */
function pragueLocalToIso(value: string): string {
  const [d, t = '23:59'] = value.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const asUtc = Date.UTC(y, mo - 1, da, h, mi);
  let ts = asUtc - pragueOffsetMs(asUtc);
  ts = asUtc - pragueOffsetMs(ts); // second pass handles the DST switch
  return new Date(ts).toISOString();
}

function isLiveNow(c: Coupon): boolean {
  if (!c.active) return false;
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= Date.now()) return false;
  if (c.maxRedemptions !== null && c.redemptionCount >= c.maxRedemptions) return false;
  return true;
}

export default function AdminCouponsPage() {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [bannerCouponId, setBannerCouponId] = useState<string | null>(null);
  const [bannerSaving, setBannerSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/coupons');
    const data = await res.json();
    setCoupons(data.coupons ?? []);
    const b = await fetch('/api/admin/promo-banner').then((r) => (r.ok ? r.json() : { couponId: null }));
    setBannerCouponId(b.couponId ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const generateCode = () => {
    const random = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    setCode(random);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c)));
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    });
  };

  const handleToggleBanner = async (coupon: Coupon) => {
    const next = bannerCouponId === coupon.id ? null : coupon.id;
    setBannerSaving(true);
    const res = await fetch('/api/admin/promo-banner', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponId: next }),
    });
    if (res.ok) setBannerCouponId(next);
    setBannerSaving(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const discountValueNum =
      discountType === 'percentage' ? parseInt(discountValue, 10) : Math.round(parseFloat(discountValue) * 100);
    if (!code.trim() || !Number.isInteger(discountValueNum) || discountValueNum <= 0) {
      setFormError(t.admin.discountValue);
      return;
    }

    setSaving(true);
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        discountType,
        discountValue: discountValueNum,
        maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
        expiresAt: expiresAt ? pragueLocalToIso(expiresAt) : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error === 'code_taken' ? t.admin.couponCodeTaken : t.admin.discountValue);
      setSaving(false);
      return;
    }

    setCode('');
    setDiscountValue('');
    setMaxRedemptions('');
    setExpiresAt('');
    setShowForm(false);
    setSaving(false);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">{t.admin.coupons}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          {t.admin.addCoupon}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-card p-6 mb-6 space-y-3">
          <div className="flex gap-2">
            <input
              placeholder={t.admin.code}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 border border-ink-lighter/30 rounded-lg px-4 py-2.5 font-mono"
            />
            <button
              type="button"
              onClick={generateCode}
              className="flex-shrink-0 bg-sage-light text-ink text-sm font-medium px-4 rounded-lg"
            >
              {t.admin.generateCode}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ink-light mb-1">{t.admin.discountType}</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              >
                <option value="percentage">{t.admin.percentage}</option>
                <option value="fixed">{t.admin.fixed}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-ink-light mb-1">{t.admin.discountValue}</label>
              <input
                type="number"
                min={1}
                max={discountType === 'percentage' ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '10' : '100'}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ink-light mb-1">{t.admin.maxRedemptions}</label>
              <input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder={t.admin.unlimited}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-light mb-1">{t.admin.expiresAtTime}</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              />
            </div>
          </div>

          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-full transition-colors"
          >
            {t.admin.save}
          </button>
        </form>
      )}

      <p className="mb-4 text-sm text-ink-light bg-brand-light rounded-xl px-4 py-3">📣 {t.admin.bannerHelp}</p>

      {loading ? null : coupons.length === 0 ? (
        <p className="text-ink-light">{t.admin.noCoupons}</p>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center gap-4 bg-white rounded-xl shadow-card p-4">
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-ink">{coupon.code}</p>
                <p className="text-sm text-ink-light">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatCzk(coupon.discountValue)}
                  {' · '}
                  {t.admin.redemptions}: {coupon.redemptionCount}/{coupon.maxRedemptions ?? '∞'}
                  {coupon.expiresAt &&
                    ` · ${new Date(coupon.expiresAt).toLocaleString('cs-CZ', { timeZone: SHOP_TIME_ZONE, dateStyle: 'short', timeStyle: 'short' })}`}
                </p>
                {bannerCouponId === coupon.id && (
                  <p className="mt-1 text-xs text-ink-light">
                    {!isLiveNow(coupon) ? `⚠️ ${t.admin.bannerHidden}` : !coupon.expiresAt ? `ℹ️ ${t.admin.bannerNoExpiry}` : null}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggleBanner(coupon)}
                disabled={bannerSaving}
                className={`text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-60 ${
                  bannerCouponId === coupon.id ? 'bg-ink text-white' : 'bg-brand-light text-brand-dark hover:bg-brand/20'
                }`}
              >
                {bannerCouponId === coupon.id ? t.admin.inBanner : `📣 ${t.admin.showInBanner}`}
              </button>
              <button
                onClick={() => handleToggleActive(coupon)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  coupon.active ? 'bg-sage-light text-sage-dark' : 'bg-ink-lighter/20 text-ink-light'
                }`}
              >
                {coupon.active ? t.admin.couponActiveLabel : t.admin.couponInactiveLabel}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
