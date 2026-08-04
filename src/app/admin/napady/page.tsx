'use client';

import { useEffect, useState } from 'react';
import type { CustomRequest } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminCustomRequestsPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/custom-requests');
      const data = await res.json();
      setRequests(data.requests ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">{t.admin.customRequests}</h1>

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
              <div className="min-w-0">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
