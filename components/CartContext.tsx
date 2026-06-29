"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  CartItem,
  getCart,
  addToCart,
  updateQty,
  removeFromCart,
  clearCart as libClearCart,
  cartTotal,
  cartCount,
} from "@/lib/cart";

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  setQty: (productId: string, quantity: number, pointure?: string) => void;
  remove: (productId: string, pointure?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => { setItems(getCart()); }, []);

  const add = useCallback((item: CartItem) => { setItems(addToCart(item)); }, []);
  const setQty = useCallback((productId: string, quantity: number, pointure?: string) => {
    setItems(updateQty(productId, quantity, pointure));
  }, []);
  const remove = useCallback((productId: string, pointure?: string) => {
    setItems(removeFromCart(productId, pointure));
  }, []);
  const clearCart = useCallback(() => { libClearCart(); setItems([]); }, []);

  return (
    <CartContext.Provider value={{ items, count: cartCount(items), total: cartTotal(items), add, setQty, remove, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}
