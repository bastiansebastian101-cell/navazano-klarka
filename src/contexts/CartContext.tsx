'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  nameCs: string;
  nameEn: string;
  priceCzk: number;
  imageUrl: string | null;
  quantity: number;
}

// Two different variants of the same product are separate cart lines —
// variantId is part of the line's identity, not just a display detail.
function sameLine(a: { productId: string; variantId: string | null }, b: { productId: string; variantId: string | null }) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  setQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clear: () => void;
  totalCzk: number;
  totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'navazano-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Older carts predate variants — backfill so sameLine() comparisons
        // against newly-added items (variantId: null) still work correctly.
        setItems(
          Array.isArray(parsed)
            ? parsed.map((i) => ({ variantId: null, variantLabel: null, ...i }))
            : []
        );
      } catch {
        // corrupted cart data, start fresh
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextType['addItem'] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item));
      if (existing) {
        return prev.map((i) => (sameLine(i, item) ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: string, variantId: string | null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, { productId, variantId })));
  };

  const setQuantity = (productId: string, variantId: string | null, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (sameLine(i, { productId, variantId }) ? { ...i, quantity } : i))
    );
  };

  const clear = () => setItems([]);

  const totalCzk = items.reduce((sum, i) => sum + i.priceCzk * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear, totalCzk, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
