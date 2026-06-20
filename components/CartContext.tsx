"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  CartItem,
  getCart,
  addToCart,
  updateQty,
  removeFromCart,
  clearCart,
  cartTotal,
  cartCount,
} from "@/lib/cart";

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const add = useCallback((item: CartItem) => {
    setItems(addToCart(item));
  }, []);

  const setQty = useCallback((productId: string, quantity: number) => {
    setItems(updateQty(productId, quantity));
  }, []);

  const remove = useCallback((productId: string) => {
    setItems(removeFromCart(productId));
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{ items, count: cartCount(items), total: cartTotal(items), add, setQty, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}
