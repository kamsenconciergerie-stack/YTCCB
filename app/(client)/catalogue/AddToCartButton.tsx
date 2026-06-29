"use client";
import { useState } from "react";
import { useCart } from "@/components/CartContext";

interface Props {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  pointure?: string;
  couleur?: string;
  stockTotal?: number;
}

export function AddToCartButton({ productId, name, price, imageUrl, pointure, couleur, stockTotal = 999 }: Props) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add({ productId, name, price, quantity: qty, imageUrl, pointure, couleur });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-wider">Qté</span>
        <div className="flex items-center border border-gray-200">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-[#F5F5F5] transition-colors text-lg"
          >
            −
          </button>
          <span className="w-10 text-center font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stockTotal, q + 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-[#F5F5F5] transition-colors text-lg"
          >
            +
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={stockTotal === 0}
        className="btn-noir w-full py-4 disabled:opacity-50"
      >
        {added ? "✓ Ajouté au panier !" : "🛒 Ajouter au panier"}
      </button>
    </div>
  );
}
