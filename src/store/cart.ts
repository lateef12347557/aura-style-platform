import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string | null;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: string, variantId: string | null) => void;
  setQty: (productId: string, variantId: string | null, qty: number) => void;
  clear: () => void;
}

const keyOf = (p: string, v: string | null) => `${p}:${v ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const k = keyOf(item.productId, item.variantId);
          const existing = s.items.find(
            (i) => keyOf(i.productId, i.variantId) === k,
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                keyOf(i.productId, i.variantId) === k
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),
      remove: (p, v) =>
        set((s) => ({
          items: s.items.filter(
            (i) => keyOf(i.productId, i.variantId) !== keyOf(p, v),
          ),
        })),
      setQty: (p, v, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              keyOf(i.productId, i.variantId) === keyOf(p, v)
                ? { ...i, quantity: Math.max(1, qty) }
                : i,
            ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "atelier-cart-v1" },
  ),
);

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.quantity, 0);