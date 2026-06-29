"use client";
import { useCart } from "./CartContext";

export function CartCount() {
  const { count } = useCart();
  return (
    <a
      href="/panier"
      className="relative inline-flex items-center gap-1.5 transition-colors"
      style={{ color: "var(--mts-primary)" }}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
          style={{ backgroundColor: "var(--mts-accent)" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </a>
  );
}
