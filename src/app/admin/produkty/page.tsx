'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@prisma/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCzk } from '@/lib/format';
import { ProductFormModal } from '@/components/admin/ProductFormModal';

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

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

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">{t.admin.products}</h1>
        <button
          onClick={() => setEditing('new')}
          className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
        >
          {t.admin.addProduct}
        </button>
      </div>

      {loading ? null : products.length === 0 ? (
        <p className="text-ink-light">{t.admin.noProducts}</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 bg-white rounded-xl shadow-card p-4">
              <div className="w-16 h-16 bg-sage-light rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.nameCs} className="w-full h-full object-cover" />
                ) : (
                  '🌸'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink truncate">
                  {product.nameCs} {!product.active && <span className="text-xs text-ink-lighter">({product.category})</span>}
                </p>
                <p className="text-sm text-brand font-semibold">{formatCzk(product.priceCzk)}</p>
                {!product.active && <p className="text-xs text-red-500">inactive</p>}
              </div>
              <button onClick={() => setEditing(product)} className="text-sm text-brand hover:text-brand-hover">
                {t.admin.edit}
              </button>
              <button onClick={() => handleDelete(product.id)} className="text-sm text-ink-light hover:text-red-600">
                {t.admin.delete}
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
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
