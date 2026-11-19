'use client';

import { useEffect, useState } from 'react';
import type { Product, ProductVariant } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { ProductFormModal } from '@/components/admin/ProductFormModal';

type ProductWithVariants = Product & { variants: ProductVariant[] };

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductWithVariants | 'new' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t.admin.delete}: ${name}?`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    setNotice(data.deactivated ? t.admin.productDeactivatedNotice : t.admin.productDeletedNotice);
    load();
  };

  const handleReactivate = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    });
    load();
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featuredOnHome: !current }),
    });
    load();
  };

  // Move a product to a new place (0-based) and save the whole order.
  const moveTo = async (from: number, to: number) => {
    if (to < 0 || to >= products.length || to === from) return;
    const next = [...products];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setProducts(next);
    const res = await fetch('/api/admin/products/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: next.map((p) => p.id) }),
    });
    if (res.ok) setNotice(t.admin.orderSaved);
    else load();
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportHref =
    selectedIds.size > 0
      ? `/api/admin/products/export?ids=${Array.from(selectedIds).join(',')}`
      : '/api/admin/products/export';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">{t.admin.products}</h1>
        <div className="flex items-center gap-3">
          <a
            href={exportHref}
            className="border border-brand text-brand hover:bg-brand-light text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            {selectedIds.size > 0 ? `${t.admin.downloadSelected} (${selectedIds.size})` : t.admin.downloadCatalog}
          </a>
          <button
            onClick={() => setEditing('new')}
            className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            {t.admin.addProduct}
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between bg-sage-light text-ink text-sm rounded-lg px-4 py-2.5">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-ink-light hover:text-ink">
            ×
          </button>
        </div>
      )}

      {loading ? null : products.length === 0 ? (
        <p className="text-ink-light">{t.admin.noProducts}</p>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-4 bg-white rounded-xl shadow-card p-4">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => moveTo(index, index - 1)}
                  disabled={index === 0}
                  title={t.admin.moveUp}
                  aria-label={t.admin.moveUp}
                  className="text-ink-light hover:text-brand disabled:opacity-20 leading-none"
                >
                  ▲
                </button>
                <input
                  key={`${product.id}-${index}`}
                  type="number"
                  min={1}
                  max={products.length}
                  defaultValue={index + 1}
                  title={t.admin.placeLabel}
                  aria-label={t.admin.placeLabel}
                  onBlur={(e) => {
                    const place = parseInt(e.target.value, 10);
                    if (Number.isInteger(place)) moveTo(index, Math.min(products.length, Math.max(1, place)) - 1);
                    else e.target.value = String(index + 1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="w-12 text-center text-sm font-semibold border border-ink-lighter/30 rounded-md py-1"
                />
                <button
                  type="button"
                  onClick={() => moveTo(index, index + 1)}
                  disabled={index === products.length - 1}
                  title={t.admin.moveDown}
                  aria-label={t.admin.moveDown}
                  className="text-ink-light hover:text-brand disabled:opacity-20 leading-none"
                >
                  ▼
                </button>
              </div>
              <input
                type="checkbox"
                checked={selectedIds.has(product.id)}
                onChange={() => toggleSelected(product.id)}
                className="w-4 h-4 flex-shrink-0 accent-brand"
                aria-label={product.nameCs}
              />
              <div className="w-16 h-16 bg-sage-light rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                {product.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrls[0]} alt={product.nameCs} className="w-full h-full object-cover" />
                ) : (
                  '🌸'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">
                  {product.nameCs} {!product.active && <span className="text-xs text-ink-lighter">({product.category})</span>}
                </p>
                <p className="text-sm text-brand font-semibold">{formatCzk(product.priceCzk)}</p>
                {!product.active && <p className="text-xs text-red-500">{t.admin.couponInactiveLabel}</p>}
                {product.featuredOnHome && <p className="text-xs text-sage-dark">{t.admin.onHomeLabel}</p>}
                {product.variants.length > 0 && (
                  <p className="text-xs text-ink-lighter">
                    {product.variants.length} {t.admin.variantsCountLabel}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleToggleFeatured(product.id, product.featuredOnHome)}
                title={product.featuredOnHome ? t.admin.removeFromHome : t.admin.moveToHome}
                className={`text-xl leading-none ${product.featuredOnHome ? 'text-brand' : 'text-ink-lighter hover:text-brand'}`}
              >
                {product.featuredOnHome ? '★' : '☆'}
              </button>
              <button onClick={() => setEditing(product)} className="text-sm text-brand hover:text-brand-hover">
                {t.admin.edit}
              </button>
              {!product.active && (
                <button onClick={() => handleReactivate(product.id)} className="text-sm text-sage-dark hover:text-sage">
                  {t.admin.reactivate}
                </button>
              )}
              <button onClick={() => handleDelete(product.id, product.nameCs)} className="text-sm text-ink-light hover:text-red-600">
                {t.admin.delete}
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          existingCategories={Array.from(new Set(products.map((p) => p.category))).sort()}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
