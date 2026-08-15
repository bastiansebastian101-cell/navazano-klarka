'use client';

import { useState } from 'react';
import type { Product } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_IMAGES = 3;

export function ProductFormModal({
  product,
  existingCategories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  existingCategories: string[];
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
  const [imageSlots, setImageSlots] = useState<(string | null)[]>(() => {
    const existing = product?.imageUrls ?? [];
    return Array.from({ length: MAX_IMAGES }, (_, i) => existing[i] ?? null);
  });
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [active, setActive] = useState(product?.active ?? true);
  const [featuredOnHome, setFeaturedOnHome] = useState(product?.featuredOnHome ?? false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (slotIndex: number, file: File) => {
    setUploadingSlot(slotIndex);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (data.url) {
      setImageSlots((prev) => prev.map((url, i) => (i === slotIndex ? data.url : url)));
    }
    setUploadingSlot(null);
  };

  const handleRemoveSlot = (slotIndex: number) => {
    setImageSlots((prev) => prev.map((url, i) => (i === slotIndex ? null : url)));
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
      imageUrls: imageSlots.filter((url): url is string => url !== null),
      active,
      featuredOnHome,
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

  const anyUploading = uploadingSlot !== null;

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
              <input
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t.admin.categoryPlaceholder}
                className="w-full border border-ink-lighter/30 rounded-lg px-4 py-2.5"
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm text-ink-light mb-2">
              {t.admin.image} ({t.admin.upTo3Photos})
            </label>
            <div className="grid grid-cols-3 gap-3">
              {imageSlots.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg border border-ink-lighter/30 relative overflow-hidden bg-sage-light">
                  {url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink/70 text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </>
                  ) : uploadingSlot === i ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-light text-center px-1">
                      {t.admin.uploading}
                    </div>
                  ) : (
                    <label className="w-full h-full flex items-center justify-center text-2xl text-ink-lighter cursor-pointer">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(i, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            {t.admin.active}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={featuredOnHome}
              onChange={(e) => setFeaturedOnHome(e.target.checked)}
            />
            {t.admin.featuredOnHome}
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving || anyUploading}
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
