'use client';

import { useEffect, useState } from 'react';
import type { Review } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/reviews');
    const data = await res.json();
    setReviews(data.reviews ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (r: Review) => {
    setEditingId(r.id);
    setCustomerName(r.customerName);
    setRating(r.rating);
    setComment(r.comment);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, rating, comment }),
    });
    if (res.ok) {
      setEditingId(null);
      load();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.admin.delete + '?')) return;
    setDeletingId(id);
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">{t.admin.reviews}</h1>

      {loading ? null : reviews.length === 0 ? (
        <p className="text-ink-light">{t.admin.noReviews}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-card p-5">
              {editingId === r.id ? (
                <div className="space-y-3">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-ink-lighter/30 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-2xl leading-none"
                      >
                        <span className={star <= rating ? 'text-brand' : 'text-ink-lighter/40'}>★</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-lg border border-ink-lighter/30 px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(r.id)}
                      disabled={saving}
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
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-brand text-sm" aria-hidden="true">
                        {'★'.repeat(r.rating)}
                        <span className="text-ink-lighter/40">{'★'.repeat(5 - r.rating)}</span>
                      </div>
                      <p className="font-medium text-ink mt-1">{r.customerName}</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={() => startEdit(r)} className="text-sm text-brand hover:text-brand-hover">
                        {t.admin.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="text-sm text-ink-light hover:text-red-600"
                      >
                        {t.admin.delete}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-ink-light whitespace-pre-wrap">{r.comment}</p>
                  <p className="mt-2 text-xs text-ink-lighter">
                    {new Date(r.createdAt).toLocaleDateString('cs-CZ')}
                    {r.editedAt && ` · ${t.admin.editedLabel}`}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
