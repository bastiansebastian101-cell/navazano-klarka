'use client';

import { useEffect, useState } from 'react';
import type { Coupon } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';

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

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/coupons');
    const data = await res.json();
    setCoupons(data.coupons ?? []);
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
        expiresAt: expiresAt || null,
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
              <label className="block text-sm text-ink-light mb-1">{t.admin.expiresAt}</label>
              <input
                type="date"
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
                  {coupon.expiresAt && ` · ${new Date(coupon.expiresAt).toLocaleDateString('cs-CZ')}`}
                </p>
              </div>
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
