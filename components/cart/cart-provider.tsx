"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, CartProductInput } from "./cart-types";

const CART_STORAGE_KEY = "crossing-cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  isDrawerOpen: boolean;
  addItem: (product: CartProductInput, quantity: number) => void;
  updateItemQuantity: (code: string, quantity: number) => void;
  removeItem: (code: string) => void;
  clearCart: () => void;
  getItemQuantity: (code: string) => number;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);

      if (!storedValue) {
        return;
      }

      const parsed = JSON.parse(storedValue) as CartItem[];

      if (Array.isArray(parsed)) {
        setItems(parsed.filter((item) => item && typeof item.code === "string" && item.quantity > 0));
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      isDrawerOpen,
      addItem(product, quantity) {
        const normalizedQuantity = clampQuantity(quantity);

        setItems((currentItems) => {
          const existingItem = currentItems.find((item) => item.code === product.code);

          if (!existingItem) {
            return [...currentItems, { ...product, quantity: normalizedQuantity }];
          }

          return currentItems.map((item) =>
            item.code === product.code
              ? { ...item, quantity: item.quantity + normalizedQuantity }
              : item,
          );
        });
      },
      updateItemQuantity(code, quantity) {
        const normalizedQuantity = clampQuantity(quantity);

        setItems((currentItems) =>
          currentItems.map((item) =>
            item.code === code ? { ...item, quantity: normalizedQuantity } : item,
          ),
        );
      },
      removeItem(code) {
        setItems((currentItems) => currentItems.filter((item) => item.code !== code));
      },
      clearCart() {
        setItems([]);
      },
      getItemQuantity(code) {
        return items.find((item) => item.code === code)?.quantity ?? 0;
      },
      openDrawer() {
        setIsDrawerOpen(true);
      },
      closeDrawer() {
        setIsDrawerOpen(false);
      },
    };
  }, [isDrawerOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
