'use client';

import { useEffect, useState } from 'react';
import type { OfficeSubscriptionPlan, OfficeSubscriptionInquiry } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';

const COMMITMENT_LABELS_CS: Record<string, string> = { monthly: 'Měsíčně', yearly: 'Ročně (měsíční platby)' };

export default function AdminOfficeSubscriptionsPage() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<OfficeSubscriptionPlan[]>([]);
  const [inquiries, setInquiries] = useState<OfficeSubscriptionInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nameCs: '', nameEn: '', descriptionCs: '', descriptionEn: '', priceMonthlyCzk: '', priceYearlyCommitmentCzk: '' });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [contactingId, setContactingId] = useState<string | null>(null);

  const load = async () => {
    const [plansRes, inquiriesRes] = await Promise.all([
      fetch('/api/admin/office-subscription-plans'),
      fetch('/api/admin/office-subscriptions'),
    ]);
    const plansData = await plansRes.json();
    const inquiriesData = await inquiriesRes.json();
    setPlans(plansData.plans ?? []);
    setInquiries(inquiriesData.inquiries ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (plan: OfficeSubscriptionPlan) => {
    setEditingId(plan.id);
    setForm({
      nameCs: plan.nameCs,
      nameEn: plan.nameEn,
      descriptionCs: plan.descriptionCs,
      descriptionEn: plan.descriptionEn,
      priceMonthlyCzk: String(Math.round(plan.priceMonthlyCzk / 100)),
      priceYearlyCommitmentCzk: String(Math.round(plan.priceYearlyCommitmentCzk / 100)),
    });
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    await fetch(`/api/admin/office-subscription-plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameCs: form.nameCs,
        nameEn: form.nameEn,
        descriptionCs: form.descriptionCs,
        descriptionEn: form.descriptionEn,
        priceMonthlyCzk: Math.round(Number(form.priceMonthlyCzk)) * 100,
        priceYearlyCommitmentCzk: Math.round(Number(form.priceYearlyCommitmentCzk)) * 100,
      }),
    });
    setSavingId(null);
    setEditingId(null);
    load();
  };

  const handleToggleActive = async (plan: OfficeSubscriptionPlan) => {
    await fetch(`/api/admin/office-subscription-plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !plan.active }),
    });
    load();
  };

  const handleMarkContacted = async (id: string) => {
    setContactingId(id);
    await fetch(`/api/admin/office-subscriptions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markContacted: true }),
    });
    setContactingId(null);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">{t.admin.officeSubscriptions}</h1>

      <h2 className="font-display text-lg text-ink mb-3">{t.admin.officeSubscriptionPlans}</h2>
      {loading ? null : (
        <div className="space-y-4 mb-10">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-card p-5">
              {editingId === plan.id ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-light mb-1">{t.admin.nameCs}</label>
                    <input
                      value={form.nameCs}
                      onChange={(e) => setForm((f) => ({ ...f, nameCs: e.target.value }))}
                      className="w-full rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-light mb-1">{t.admin.nameEn}</label>
                    <input
                      value={form.nameEn}
                      onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                      className="w-full rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-ink-light mb-1">{t.admin.descriptionCs}</label>
                    <textarea
                      rows={2}
                      value={form.descriptionCs}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionCs: e.target.value }))}
                      className="w-full rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm resize-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-ink-light mb-1">{t.admin.descriptionEn}</label>
                    <textarea
                      rows={2}
                      value={form.descriptionEn}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                      className="w-full rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-light mb-1">{t.admin.priceMonthlyCzk}</label>
                    <input
                      type="number"
                      min="1"
                      value={form.priceMonthlyCzk}
                      onChange={(e) => setForm((f) => ({ ...f, priceMonthlyCzk: e.target.value }))}
                      className="w-full rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-light mb-1">{t.admin.priceYearlyCommitmentCzk}</label>
                    <input
                      type="number"
                      min="1"
                      value={form.priceYearlyCommitmentCzk}
                      onChange={(e) => setForm((f) => ({ ...f, priceYearlyCommitmentCzk: e.target.value }))}
                      className="w-full rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      onClick={() => handleSave(plan.id)}
                      disabled={savingId === plan.id}
                      className="bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                    >
                      {t.admin.save}
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-ink-light hover:text-ink">
                      {t.admin.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">
                      {plan.nameCs} <span className="text-ink-lighter text-sm">/ {plan.nameEn}</span>
                    </p>
                    <p className="text-sm text-ink-light mt-0.5">
                      {formatCzk(plan.priceMonthlyCzk)} {t.admin.perMonth} &middot; {formatCzk(plan.priceYearlyCommitmentCzk)} {t.admin.perMonthYearly}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-ink-light">
                      <input type="checkbox" checked={plan.active} onChange={() => handleToggleActive(plan)} />
                      {t.admin.active}
                    </label>
                    <button onClick={() => openEdit(plan)} className="text-sm text-brand hover:text-brand-hover font-medium">
                      {t.admin.edit}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display text-lg text-ink mb-3">{t.admin.officeSubscriptionInquiries}</h2>
      {loading ? null : inquiries.length === 0 ? (
        <p className="text-ink-light">{t.admin.noOfficeSubscriptionInquiries}</p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white rounded-xl shadow-card p-5">
              <p className="font-medium text-ink">{inq.companyName}</p>
              <div className="flex flex-wrap gap-x-3 text-sm">
                <span className="text-ink-light">{inq.contactName}</span>
                <a href={`mailto:${inq.email}`} className="text-brand hover:text-brand-hover">
                  {inq.email}
                </a>
                <a href={`tel:${inq.phone}`} className="text-brand hover:text-brand-hover">
                  {inq.phone}
                </a>
              </div>
              <p className="mt-1 text-sm text-ink-light">{inq.deliveryAddress}</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {inq.planTier} &middot; {COMMITMENT_LABELS_CS[inq.commitment] ?? inq.commitment} &middot; {formatCzk(inq.priceCzk)} {t.admin.perMonth}
              </p>
              {inq.message && <p className="mt-2 text-sm text-ink-light whitespace-pre-wrap">{inq.message}</p>}
              <p className="mt-2 text-xs text-ink-lighter">{new Date(inq.createdAt).toLocaleString('cs-CZ')}</p>

              <div className="mt-3 pt-3 border-t border-ink-lighter/15">
                {inq.contactedAt ? (
                  <p className="text-sm text-sage-dark font-medium">✅ {t.admin.contactedLabel}</p>
                ) : (
                  <button
                    onClick={() => handleMarkContacted(inq.id)}
                    disabled={contactingId === inq.id}
                    className="bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                  >
                    {t.admin.markContacted}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
