"use client";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/format";

export default function PanierPage() {
  const { items, total, remove, setQty, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-6xl mb-4">👟</p>
        <h1 className="text-2xl font-black uppercase mb-2">Votre panier est vide</h1>
        <p className="text-gray-500 mb-6">Parcourez notre catalogue pour trouver vos chaussures.</p>
        <a href="/catalogue" className="btn-noir px-8 py-3">Voir le catalogue</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase">Mon panier</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 transition-colors">
          Vider le panier
        </button>
      </div>

      <div className="space-y-3 mb-8">
        {items.map((item) => (
          <div key={`${item.productId}-${item.pointure}`} className="bg-white border border-gray-100 p-4 flex items-center gap-4">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.pointure ? `Pointure ${item.pointure}` : ""}
                {item.couleur ? (item.pointure ? ` · ${item.couleur}` : item.couleur) : ""}
              </p>
              <p className="text-sm font-semibold text-[#C4956A] mt-1">{formatPrice(item.price)} FCFA</p>
            </div>

            <div className="flex items-center border border-gray-200 shrink-0">
              <button
                onClick={() => item.quantity > 1 ? setQty(item.productId, item.quantity - 1, item.pointure) : remove(item.productId, item.pointure)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
              <button
                onClick={() => setQty(item.productId, item.quantity + 1, item.pointure)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
              >
                +
              </button>
            </div>

            <p className="font-black text-right shrink-0 w-24">{formatPrice(item.price * item.quantity)} F</p>

            <button
              onClick={() => remove(item.productId, item.pointure)}
              className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              aria-label="Supprimer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Total articles</p>
          <p className="text-2xl font-black">{formatPrice(total)} FCFA</p>
          <p className="text-xs text-gray-400">Frais de livraison calculés à l&apos;étape suivante</p>
        </div>
        <a href="/checkout" className="btn-or px-8 py-3 text-base font-semibold w-full sm:w-auto text-center">
          Passer la commande →
        </a>
      </div>
    </div>
  );
}
