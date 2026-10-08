"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/store-types";

type CartContextValue = {
  items: CartLine[];
  count: number;
  addItem: (item: CartLine) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "fieldroom-cart-v1";
const emptyCart: CartLine[] = [];
const listeners = new Set<() => void>();

function readStoredCart(): CartLine[] {
  if (typeof window === "undefined") return emptyCart;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : emptyCart;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return emptyCart;
  }
}

let cartSnapshot = readStoredCart();

function notifyListeners() {
  for (const listener of listeners) listener();
}

function saveCart(items: CartLine[]) {
  cartSnapshot = items;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  notifyListeners();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cartSnapshot;
}

function getServerSnapshot() {
  return emptyCart;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      cartSnapshot = readStoredCart();
      notifyListeners();
    }
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function addItem(item: CartLine) {
    const existing = cartSnapshot.find(
      (line) => line.variantId === item.variantId,
    );
    if (!existing) {
      saveCart([...cartSnapshot, { ...item, quantity: 1 }]);
      return;
    }
    saveCart(
      cartSnapshot.map((line) =>
        line.variantId === item.variantId
          ? { ...line, quantity: Math.min(line.quantity + 1, item.stock) }
          : line,
      ),
    );
  }

  function removeItem(variantId: string) {
    saveCart(cartSnapshot.filter((item) => item.variantId !== variantId));
  }

  function updateQuantity(variantId: string, quantity: number) {
    if (quantity < 1) {
      removeItem(variantId);
      return;
    }
    saveCart(
      cartSnapshot.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(Math.floor(quantity), item.stock) }
          : item,
      ),
    );
  }

  function clearCart() {
    saveCart([]);
  }

  const count = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
