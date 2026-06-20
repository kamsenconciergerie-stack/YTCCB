"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/format";
import { Suspense } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PRE_CONFIRMED:  { label: "En attente de confirmation", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:      { label: "Confirmée",                  color: "bg-blue-100 text-blue-800" },
  IN_PREPARATION: { label: "En préparation",             color: "bg-purple-100 text-purple-800" },
  IN_DELIVERY:    { label: "En livraison",               color: "bg-orange-100 text-orange-800" },
  DELIVERED:      { label: "Livrée",                     color: "bg-green-100 text-green-800" },
  CANCELLED:      { label: "Annulée",                    color: "bg-red-100 text-red-800" },
};

const PAYMENT_LABELS: Record<string, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  ON_DELIVERY: "À la livraison",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  COMPLETED: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
  EXPIRED: "Expiré",
};

interface OrderData {
  orderNumber: string;
  status: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  deliveryZone?: { name: string };
  deliveryAddress?: string;
  deliveryCity?: string;
  createdAt: string;
  deliveredAt?: string;
  items: { productName: string; quantity: number; unitPrice: string; totalPrice: string; unit: string }[];
  payments: { provider: string; status: string }[];
}

function SuiviContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") ?? "");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const num = searchParams.get("orderNumber");
    if (num) {
      setOrderNumber(num);
      fetchOrder(num);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchOrder(num: string) {
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(num.trim().toUpperCase())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Commande introuvable");
        return;
      }
      setOrder(json.data);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchOrder(orderNumber);
  }

  const statusInfo = order ? STATUS_LABELS[order.status] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-display font-bold mb-2" style={{ color: "var(--ccb-green)" }}>
        Suivre ma commande
      </h1>
      <p className="text-gray-500 mb-8">Entrez votre numéro de commande (ex : CCB-202406-0001)</p>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-10">
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="CCB-AAAAMM-NNNN"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40 uppercase"
        />
        <button type="submit" disabled={loading || !orderNumber.trim()} className="btn-primary px-6 py-3 text-sm disabled:opacity-50">
          {loading ? "..." : "Rechercher"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-5 py-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {order && statusInfo && (
        <div className="card overflow-hidden">
          {/* En-tête statut */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Commande</p>
              <p className="font-bold text-lg" style={{ color: "var(--ccb-green)" }}>{order.orderNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Articles */}
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-700 mb-3">Articles commandés</h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.productName} × {item.quantity} {item.unit}
                  </span>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Livraison */}
          {(order.deliveryZone || order.deliveryAddress) && (
            <div className="p-5 border-b border-gray-100 text-sm">
              <h2 className="font-semibold text-gray-700 mb-1">Livraison</h2>
              {order.deliveryZone && <p className="text-gray-600">{order.deliveryZone.name}</p>}
              {order.deliveryAddress && <p className="text-gray-500">{order.deliveryAddress}</p>}
              {order.deliveryCity && <p className="text-gray-500">{order.deliveryCity}</p>}
            </div>
          )}

          {/* Paiement */}
          {order.payments.length > 0 && (
            <div className="p-5 border-b border-gray-100 text-sm">
              <h2 className="font-semibold text-gray-700 mb-1">Paiement</h2>
              <p className="text-gray-600">
                {PAYMENT_LABELS[order.payments[0].provider] ?? order.payments[0].provider}
                {" — "}
                {PAYMENT_STATUS_LABELS[order.payments[0].status] ?? order.payments[0].status}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="p-5 text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Livraison</span>
              <span>{Number(order.deliveryFee) > 0 ? formatPrice(order.deliveryFee) : "—"}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span style={{ color: "var(--ccb-green)" }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuiviPage() {
  return (
    <Suspense>
      <SuiviContent />
    </Suspense>
  );
}
