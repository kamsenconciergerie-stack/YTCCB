"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

interface Product { id: string; name: string; price: string; unit: string; stockQty: number; category: string; }
interface Zone { id: string; name: string; baseFee: string; }
interface CartItem { productId: string; name: string; price: number; unit: string; quantity: number; }

const CATEGORY_LABELS: Record<string, string> = {
  GROS_OEUVRE: "Gros œuvre", ETANCHEITE: "Étanchéité", CARRELAGE: "Carrelage",
  PLOMBERIE: "Plomberie", ELECTRICITE: "Électricité", SANITAIRES: "Sanitaires",
  ELECTROMENAGER: "Électroménager", SOLAIRE: "Solaire",
};

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerWhatsapp: "", customerName: "", channel: "MANUAL" as "MANUAL" | "PHONE",
    deliveryZoneId: "", deliveryAddress: "", deliveryCity: "",
    paymentMethod: "ON_DELIVERY" as "WAVE" | "ORANGE_MONEY" | "ON_DELIVERY",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=200").then((r) => r.json()),
      fetch("/api/delivery-zones").then((r) => r.json()),
    ]).then(([p, z]) => { setProducts(p.data ?? []); setZones(z.data ?? []); });
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.stockQty > 0
  );

  function addToCart(p: Product) {
    setCart((c) => {
      const ex = c.find((i) => i.productId === p.id);
      if (ex) return c.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { productId: p.id, name: p.name, price: Number(p.price), unit: p.unit, quantity: 1 }];
    });
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = zones.find((z) => z.id === form.deliveryZoneId) ? Number(zones.find((z) => z.id === form.deliveryZoneId)!.baseFee) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) { setError("Ajoutez au moins un produit"); return; }
    if (!form.customerWhatsapp) { setError("Le numéro WhatsApp est requis"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          deliveryZoneId: form.deliveryZoneId || undefined,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur"); return; }
      router.push(`/admin/commandes/${json.data.id}`);
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <a href="/admin/commandes" className="text-sm text-gray-400 hover:text-gray-600">← Commandes</a>
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>Nouvelle commande</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sélection produits */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-3 text-sm text-gray-700">Produits</h2>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40" />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.slice(0, 30).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400">{CATEGORY_LABELS[p.category]} — {formatPrice(p.price)}/{p.unit}</p>
                  </div>
                  <button onClick={() => addToCart(p)} className="text-xs btn-primary py-1 px-3">+ Ajouter</button>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun produit</p>}
            </div>
          </div>

          {/* Panier */}
          {cart.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold mb-3 text-sm text-gray-700">Panier ({cart.length})</h2>
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                      <button onClick={() => setCart((c) => item.quantity > 1 ? c.map((i) => i.productId === item.productId ? {...i, quantity: i.quantity - 1} : i) : c.filter((i) => i.productId !== item.productId))}
                        className="w-7 h-7 hover:bg-gray-100 text-gray-600">−</button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => setCart((c) => c.map((i) => i.productId === item.productId ? {...i, quantity: i.quantity + 1} : i))}
                        className="w-7 h-7 hover:bg-gray-100 text-gray-600">+</button>
                    </div>
                    <span className="text-sm font-semibold w-24 text-right">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulaire client + soumission */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-sm text-gray-700">Client</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp *</label>
              <input type="tel" required value={form.customerWhatsapp} onChange={(e) => setForm((f) => ({ ...f, customerWhatsapp: e.target.value }))}
                placeholder="+221 77 000 00 00" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
              <input type="text" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                placeholder="Nom du client" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Canal</label>
              <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as "MANUAL" | "PHONE" }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
                <option value="MANUAL">Saisie manuelle</option>
                <option value="PHONE">Téléphone</option>
              </select>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-sm text-gray-700">Livraison</h2>
            <select value={form.deliveryZoneId} onChange={(e) => setForm((f) => ({ ...f, deliveryZoneId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
              <option value="">Retrait / non précisé</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {formatPrice(z.baseFee)}</option>)}
            </select>
            <input type="text" value={form.deliveryAddress} onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
              placeholder="Adresse" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
            <input type="text" value={form.deliveryCity} onChange={(e) => setForm((f) => ({ ...f, deliveryCity: e.target.value }))}
              placeholder="Ville" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>

          <div className="card p-5 space-y-2">
            <h2 className="font-semibold text-sm text-gray-700">Paiement</h2>
            {(["ON_DELIVERY", "WAVE", "ORANGE_MONEY"] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="pm" value={m} checked={form.paymentMethod === m} onChange={() => setForm((f) => ({ ...f, paymentMethod: m }))} className="w-4 h-4" />
                {m === "ON_DELIVERY" ? "À la livraison" : m === "WAVE" ? "Wave" : "Orange Money"}
              </label>
            ))}
          </div>

          <div className="card p-5">
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Notes..." rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none" />
          </div>

          {/* Total */}
          <div className="card p-4 text-sm space-y-1">
            <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Livraison</span><span>{deliveryFee > 0 ? formatPrice(deliveryFee) : "—"}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span style={{ color: "var(--ccb-green)" }}>{formatPrice(subtotal + deliveryFee)}</span></div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading || cart.length === 0} className="w-full btn-gold py-3 text-sm font-semibold disabled:opacity-50">
            {loading ? "Enregistrement..." : "Créer la commande"}
          </button>
        </form>
      </div>
    </div>
  );
}
