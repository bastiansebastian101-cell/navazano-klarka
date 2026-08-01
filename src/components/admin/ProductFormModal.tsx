'use client';

import { useState } from 'react';
import type { Product } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORIES = ['bouquet', 'plant', 'gift'] as const;

export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [nameCs, setNameCs] = useState(product?.nameCs ?? '');
  const [nameEn, setNameEn] = useState(product?.nameEn ?? '');
  const [descriptionCs, setDescriptionCs] = useState(product?.descriptionCs ?? '');
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? '');
  const [priceCzk, setPriceCzk] = useState(product ? Math.round(product.priceCzk / 100) : 0);
  const [category, setCategory] = useState(product?.category ?? 'bouquet');
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ?? null);
  const [active, setActive] = useState(product?.active ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) setImageUrl(data.url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      nameCs,
      nameEn,
      descriptionCs,
      descriptionEn,
      priceCzk: Math.round(priceCzk * 100),
      category,
      imageUrl,
      active,
    };

    if (product) {
      await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-card-hover max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl text-ink mb-5">{product ? t.admin.editProduct : t.admin.addProduct}</h2>

        <div className="space-y-3">
          <input
            placeholder={t.admin.nameCs}
            value={nameCs}
            onChange={(e) => setNameCs(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
          <input
            placeholder={t.admin.nameEn}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
          <textarea
            placeholder={t.admin.descriptionCs}
            rows={2}
            value={descriptionCs}
            onChange={(e) => setDescriptionCs(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
          <textarea
            placeholder={t.admin.descriptionEn}
            rows={2}
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-ink-light mb-1">{t.admin.priceCzk}</label>
              <input
                type="number"
                min={0}
                value={priceCzk}
                onChange={(e) => setPriceCzk(parseInt(e.target.value, 10) || 0)}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm text-ink-light mb-1">{t.admin.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-light mb-1">{t.admin.image}</label>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-24 h-24 object-cover rounded-lg mb-2" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            {uploading && <p className="text-sm text-ink-light mt-1">{t.admin.uploading}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            {t.admin.active}
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 bg-brand hover:bg-brand-hover disabled:opacity-60 text-white font-semibold py-2.5 rounded-full transition-colors"
          >
            {t.admin.save}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-ink-lighter/30 text-ink font-semibold py-2.5 rounded-full transition-colors"
          >
            {t.admin.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
