"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";

type Zone = { id: string; name: string; baseFee: number };

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();

  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({
    customerName: "",
    customerWhatsapp: "",
    deliveryZoneId: "",
    deliveryAddress: "",
    deliveryCity: "",
    notes: "",
    canal: "WEB" as "WEB" | "WHATSAPP",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((r) => r.json())
      .then((d) => setZones(d.data ?? []))
      .catch(() => {});
  }, []);

  const selectedZone = zones.find((z) => z.id === form.deliveryZoneId);
  const deliveryFee = selectedZone ? Number(selectedZone.baseFee) : 0;
  const grandTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🛍️</span>
        <h1 className="text-2xl font-display font-black uppercase mb-4">Panier vide</h1>
        <a href="/catalogue" className="btn-noir">Voir la boutique</a>
      </div>
    );
  }

  async function handleSubmit(canal: "WEB" | "WHATSAPP") {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerWhatsapp: form.customerWhatsapp,
          deliveryZoneId: form.deliveryZoneId,
          deliveryAddress: form.deliveryAddress,
          deliveryCity: form.deliveryCity,
          notes: form.notes,
          canalFinalisation: canal,
          items: items.map((it) => ({
            chaussureId: it.productId,
            quantity: it.quantity,
            pointure: it.pointure,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur lors de la commande"); return; }

      const { orderId, numeroCommande } = data.data;
      clearCart();

      if (canal === "WHATSAPP") {
        const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "221700000000").replace("+", "");
        const lines = items.map((it) => `• ${it.name} x${it.quantity}${it.pointure ? ` (P${it.pointure})` : ""}`).join("\n");
        const txt = encodeURIComponent(
          `Bonjour ! Je viens de passer la commande *${numeroCommande}*\n${lines}\nTotal : ${grandTotal.toLocaleString("fr-FR")} FCFA`
        );
        window.open(`https://wa.me/${waNumber}?text=${txt}`, "_blank");
        router.push(`/suivi?num=${numeroCommande}`);
      } else {
        // Rediriger vers le paiement Wave
        const payRes = await fetch("/api/payments/wave/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount: grandTotal }),
        });
        const payData = await payRes.json();
        if (payData.data?.paymentLink) {
          window.location.href = payData.data.paymentLink;
        } else {
          router.push(`/suivi?num=${numeroCommande}`);
        }
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <nav className="text-xs text-gray-400 mb-6">
        <a href="/">Accueil</a> <span className="mx-2">›</span>
        <a href="/panier">Panier</a> <span className="mx-2">›</span>
        <span>Commande</span>
      </nav>
      <h1 className="text-3xl font-display font-black uppercase mb-8">Finaliser la commande</h1>

      <div className="grid md:grid-cols-2 gap-10">
        {/* ── Formulaire ──────────────────────────── */}
        <div className="space-y-4">
          <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Vos informations</h2>

          <input
            className="input"
            placeholder="Votre nom *"
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Numéro WhatsApp * (+221 7X XXX XX XX)"
            value={form.customerWhatsapp}
            onChange={(e) => setForm({ ...form, customerWhatsapp: e.target.value })}
          />

          <select
            className="input bg-white"
            value={form.deliveryZoneId}
            onChange={(e) => setForm({ ...form, deliveryZoneId: e.target.value })}
          >
            <option value="">Sélectionner la zone de livraison *</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} — {Number(z.baseFee).toLocaleString("fr-FR")} FCFA
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Adresse de livraison *"
            value={form.deliveryAddress}
            onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
          />
          <input
            className="input"
            placeholder="Ville *"
            value={form.deliveryCity}
            onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
          />
          <textarea
            className="input h-24 resize-none"
            placeholder="Notes (facultatif)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* ── Boutons paiement ──────────────────── */}
          <div className="pt-4 space-y-3">
            <button
              disabled={loading || !form.customerName || !form.customerWhatsapp || !form.deliveryZoneId || !form.deliveryAddress}
              onClick={() => handleSubmit("WEB")}
              className="btn-noir w-full py-4 disabled:opacity-50"
            >
              {loading ? "Traitement…" : `💳 Payer avec Wave — ${grandTotal.toLocaleString("fr-FR")} FCFA`}
            </button>
            <button
              disabled={loading || !form.customerName || !form.customerWhatsapp || !form.deliveryZoneId || !form.deliveryAddress}
              onClick={() => handleSubmit("WHATSAPP")}
              className="btn-wa w-full py-4 disabled:opacity-50"
            >
              {loading ? "Traitement…" : "💬 Finaliser sur WhatsApp"}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            En commandant, vous acceptez d&apos;être contacté pour la livraison.
          </p>
        </div>

        {/* ── Récapitulatif ──────────────────────── */}
        <div>
          <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Récapitulatif</h2>
          <div className="bg-[#F5F5F5] p-6 space-y-3">
            {items.map((it) => (
              <div key={`${it.productId}-${it.pointure}`} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">{it.name}</span>
                  {it.pointure && <span className="text-gray-500 ml-1">P{it.pointure}</span>}
                  <span className="text-gray-400 ml-1">×{it.quantity}</span>
                </div>
                <span className="font-semibold">{(it.price * it.quantity).toLocaleString("fr-FR")} FCFA</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{total.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Livraison</span>
              <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString("fr-FR")} FCFA` : "À calculer"}</span>
            </div>
            <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-[#C4956A]">{grandTotal.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
