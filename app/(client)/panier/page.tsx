"use client";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/format";

export default function PanierPage() {
  const { items, total, remove, setQty, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h1 className="text-2xl font-display font-bold text-gray-800 mb-2">Votre panier est vide</h1>
        <p className="text-gray-500 mb-6">Parcourez notre catalogue pour trouver vos matériaux.</p>
        <a href="/catalogue" className="btn-primary px-8 py-3">
          Voir le catalogue
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-bold" style={{ color: "var(--ccb-green)" }}>
          Mon panier
        </h1>
        <button
          onClick={clear}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Vider le panier
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div key={item.productId} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <a href={`/catalogue/${item.slug}`} className="font-semibold text-gray-900 hover:text-ccb-green-600 line-clamp-1">
                {item.name}
              </a>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatPrice(item.price)} / {item.unit}
              </p>
            </div>

            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() =>
                  item.quantity > 1
                    ? setQty(item.productId, item.quantity - 1)
                    : remove(item.productId)
                }
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600"
              >
                −
              </button>
              <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => setQty(item.productId, item.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600"
              >
                +
              </button>
            </div>

            <div className="text-right shrink-0">
              <p className="font-bold" style={{ color: "var(--ccb-green)" }}>
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>

            <button
              onClick={() => remove(item.productId)}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Total articles</p>
          <p className="text-2xl font-bold" style={{ color: "var(--ccb-green)" }}>
            {formatPrice(total)}
          </p>
          <p className="text-xs text-gray-400">Frais de livraison calculés à l&apos;étape suivante</p>
        </div>
        <a href="/checkout" className="btn-gold px-8 py-3 text-base font-semibold w-full sm:w-auto text-center">
          Passer la commande
        </a>
      </div>
    </div>
  );
}
