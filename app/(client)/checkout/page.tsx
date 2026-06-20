"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { formatPrice } from "@/lib/format";

interface DeliveryZone {
  id: string;
  name: string;
  baseFee: string;
  description: string | null;
}

interface OrderResult {
  orderNumber: string;
  total: number;
  paymentMethod: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  WAVE: "Wave",
  ORANGE_MONEY: "Orange Money",
  ON_DELIVERY: "Paiement à la livraison",
};

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerWhatsapp: "",
    deliveryZoneId: "",
    deliveryAddress: "",
    deliveryCity: "",
    paymentMethod: "ON_DELIVERY" as "WAVE" | "ORANGE_MONEY" | "ON_DELIVERY",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((r) => r.json())
      .then((data) => setZones(data.data ?? []))
      .catch(() => {});
  }, []);

  const deliveryFee = zones.find((z) => z.id === form.deliveryZoneId)
    ? Number(zones.find((z) => z.id === form.deliveryZoneId)!.baseFee)
    : 0;

  const grandTotal = total + deliveryFee;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerWhatsapp) {
      setError("Le numéro WhatsApp est requis");
      return;
    }
    if (items.length === 0) {
      setError("Votre panier est vide");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName || undefined,
          customerWhatsapp: form.customerWhatsapp,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryZoneId: form.deliveryZoneId || undefined,
          deliveryAddress: form.deliveryAddress || undefined,
          deliveryCity: form.deliveryCity || undefined,
          paymentMethod: form.paymentMethod,
          notes: form.notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur lors de la commande");
        return;
      }

      clear();
      setResult(json.data);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace("+", "") ?? "";
    const waText = encodeURIComponent(
      `Bonjour CCB, je viens de passer la commande ${result.orderNumber} (${formatPrice(result.total)}, paiement : ${PAYMENT_LABELS[result.paymentMethod]}). Pouvez-vous confirmer ?`
    );
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl" style={{ backgroundColor: "var(--ccb-green)" }}>
          ✓
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Commande enregistrée !</h1>
        <p className="text-gray-500 mb-1">Votre numéro de commande :</p>
        <p className="text-2xl font-bold mb-6" style={{ color: "var(--ccb-gold)" }}>
          {result.orderNumber}
        </p>
        <p className="text-gray-600 mb-8 text-sm">
          Notez ce numéro pour suivre votre commande. Notre équipe vous contactera sur WhatsApp pour confirmer.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`https://wa.me/${waNumber}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary py-3 text-sm"
          >
            Confirmer sur WhatsApp
          </a>
          <a href={`/suivi?orderNumber=${result.orderNumber}`} className="btn-gold py-3 text-sm">
            Suivre ma commande
          </a>
          <a href="/catalogue" className="text-sm text-gray-500 hover:text-gray-700">
            Continuer les achats
          </a>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-xl font-display font-bold text-gray-800 mb-4">Votre panier est vide</h1>
        <a href="/catalogue" className="btn-primary px-6 py-3">Voir le catalogue</a>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-display font-bold mb-8" style={{ color: "var(--ccb-green)" }}>
        Finaliser la commande
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Vos coordonnées</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom (optionnel)</label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                placeholder="Votre nom"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.customerWhatsapp}
                onChange={(e) => set("customerWhatsapp", e.target.value)}
                placeholder="+221 77 000 00 00"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40"
              />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Livraison</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone de livraison</label>
              <select
                value={form.deliveryZoneId}
                onChange={(e) => set("deliveryZoneId", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40 bg-white"
              >
                <option value="">Retrait en boutique / non précisé</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {formatPrice(z.baseFee)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={form.deliveryAddress}
                onChange={(e) => set("deliveryAddress", e.target.value)}
                placeholder="Adresse de livraison"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input
                type="text"
                value={form.deliveryCity}
                onChange={(e) => set("deliveryCity", e.target.value)}
                placeholder="Dakar, Thiès..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40"
              />
            </div>
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="font-semibold text-gray-900">Paiement</h2>
            {(["ON_DELIVERY", "WAVE", "ORANGE_MONEY"] as const).map((method) => (
              <label key={method} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={form.paymentMethod === method}
                  onChange={() => set("paymentMethod", method)}
                  className="w-4 h-4 accent-ccb-green-600"
                />
                <span className="text-sm font-medium text-gray-700">{PAYMENT_LABELS[method]}</span>
              </label>
            ))}
          </div>

          <div className="card p-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Précisions sur la commande ou la livraison..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-4 text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi en cours..." : `Commander — ${formatPrice(grandTotal)}`}
          </button>
        </form>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : "—"}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
                <span>Total</span>
                <span style={{ color: "var(--ccb-green)" }}>{formatPrice(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
