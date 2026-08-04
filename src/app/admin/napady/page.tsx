'use client';

import { useEffect, useState } from 'react';
import type { CustomRequest } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';

export default function AdminCustomRequestsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [bouquetName, setBouquetName] = useState('');
  const [priceCzk, setPriceCzk] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/admin/custom-requests');
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openInvoiceForm = (r: CustomRequest) => {
    setOpenFormId(r.id);
    setBouquetName(r.bouquetName ?? '');
    setPriceCzk(r.priceCzk ? String(Math.round(r.priceCzk / 100)) : '');
    setNotice(null);
  };

  const handleSendInvoice = async (id: string) => {
    const priceNumber = Math.round(Number(priceCzk));
    if (!bouquetName.trim() || !priceNumber || priceNumber <= 0) return;

    setSendingId(id);
    const res = await fetch(`/api/admin/custom-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bouquetName: bouquetName.trim(), priceCzk: priceNumber * 100 }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotice(data.sent ? t.admin.invoiceSent : t.admin.invoiceSaveFailed);
      setOpenFormId(null);
      load();
    } else {
      setNotice(t.admin.invoiceSaveFailed);
    }
    setSendingId(null);
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">{t.admin.customRequests}</h1>

      {notice && (
        <div className="mb-4 flex items-center justify-between bg-sage-light text-ink text-sm rounded-lg px-4 py-2.5">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-ink-light hover:text-ink">
            ×
          </button>
        </div>
      )}

      {loading ? null : requests.length === 0 ? (
        <p className="text-ink-light">{t.admin.noCustomRequests}</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-card p-5 flex flex-col sm:flex-row gap-4">
              {r.imageUrl && (
                <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.imageUrl} alt="" className="w-24 h-24 rounded-lg object-cover" />
                </a>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{r.name}</p>
                <div className="flex flex-wrap gap-x-3 text-sm">
                  <a href={`mailto:${r.email}`} className="text-brand hover:text-brand-hover">
                    {r.email}
                  </a>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} className="text-brand hover:text-brand-hover">
                      {r.phone}
                    </a>
                  )}
                </div>
                {r.deliveryDate && (
                  <p className="mt-1 text-sm font-semibold text-ink">
                    Doručit: {new Date(r.deliveryDate).toLocaleDateString('cs-CZ')}
                  </p>
                )}
                <p className="mt-2 text-sm text-ink-light whitespace-pre-wrap">{r.message}</p>
                <p className="mt-2 text-xs text-ink-lighter">
                  {new Date(r.createdAt).toLocaleString('cs-CZ')}
                </p>

                <div className="mt-3 pt-3 border-t border-ink-lighter/15">
                  {r.invoiceSentAt ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-sage-dark font-medium">
                        ✅ {t.admin.invoiceSentLabel} — {r.bouquetName} ({formatCzk(r.priceCzk ?? 0)})
                      </p>
                      <button
                        onClick={() => openInvoiceForm(r)}
                        className="text-xs text-brand hover:text-brand-hover font-medium"
                      >
                        {t.admin.invoiceResend}
                      </button>
                    </div>
                  ) : openFormId !== r.id ? (
                    <button
                      onClick={() => openInvoiceForm(r)}
                      className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                    >
                      {t.admin.createInvoice}
                    </button>
                  ) : null}

                  {openFormId === r.id && (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs text-ink-light mb-1">{t.admin.bouquetName}</label>
                        <input
                          value={bouquetName}
                          onChange={(e) => setBouquetName(e.target.value)}
                          className="rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-ink-light mb-1">{t.admin.priceCzk}</label>
                        <input
                          type="number"
                          min="1"
                          value={priceCzk}
                          onChange={(e) => setPriceCzk(e.target.value)}
                          className="w-24 rounded-lg border border-ink-lighter/30 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
                        />
                      </div>
                      <button
                        onClick={() => handleSendInvoice(r.id)}
                        disabled={sendingId === r.id}
                        className="bg-brand hover:bg-brand-hover disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                      >
                        {sendingId === r.id ? t.admin.invoiceSending : t.admin.sendInvoice}
                      </button>
                      <button
                        onClick={() => setOpenFormId(null)}
                        className="text-sm text-ink-light hover:text-ink"
                      >
                        {t.admin.cancel}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
