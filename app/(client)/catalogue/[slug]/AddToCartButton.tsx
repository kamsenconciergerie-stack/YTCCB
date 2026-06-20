"use client";
import { useState } from "react";
import { useCart } from "@/components/CartContext";
import { CartItem } from "@/lib/cart";

interface Props {
  product: Omit<CartItem, "quantity">;
  stockQty: number;
}

export function AddToCartButton({ product, stockQty }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add({ ...product, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Quantité</label>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
          >
            −
          </button>
          <span className="w-10 text-center font-semibold text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stockQty, q + 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={stockQty === 0}
          className="flex-1 btn-primary py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {added ? "✓ Ajouté au panier" : "Ajouter au panier"}
        </button>

        <a href="/panier" className="btn-gold py-3 px-4 text-sm font-semibold">
          Voir le panier
        </a>
      </div>
    </div>
  );
}
