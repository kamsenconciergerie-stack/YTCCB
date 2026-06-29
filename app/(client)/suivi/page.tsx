"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMEE:  "Commande reçue",
  PAYE:           "Paiement confirmé",
  EN_PREPARATION: "En préparation",
  EN_LIVRAISON:   "En livraison",
  LIVREE:         "Livrée ✅",
  EXPIREE:        "Expirée",
  ANNULEE:        "Annulée",
};

const STATUS_ORDER = ["PRE_CONFIRMEE", "PAYE", "EN_PREPARATION", "EN_LIVRAISON", "LIVREE"];

type Order = {
  numeroCommande: string;
  status: string;
  statutPaiement: string;
  canalFinalisation: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryCity?: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
  expiresAt?: string;
  deliveryZone?: { name: string };
  livreur?: { nom: string; telephone: string };
  items: {
    chaussureNom: string;
    chaussureRef: string;
    quantity: number;
    pointure?: string;
    couleur?: string;
    unitPrice: number;
    totalPrice: number;
  }[];
};

function SuiviContent() {
  const params = useSearchParams();
  const [num, setNum] = useState(params.get("num") ?? "");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const n = params.get("num");
    if (n) { setNum(n); void search(n); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(n?: string) {
    const q = (n ?? num).trim().toUpperCase();
    if (!q) return;
    setLoading(true); setError(""); setOrder(null);
    try {
      const res = await fetch(`/api/orders/track?num=${q}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Commande introuvable"); return; }
      setOrder(data.data);
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  const currentStep = order ? STATUS_ORDER.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-display font-black uppercase mb-2">Suivi de commande</h1>
      <p className="text-gray-500 text-sm mb-8">Entrez votre numéro de commande (ex : MTS-20260629-0001)</p>

      {/* ── Barre de recherche ─── */}
      <div className="flex gap-2 mb-8">
        <input
          className="input flex-1"
          placeholder="MTS-AAAAMMJJ-XXXX"
          value={num}
          onChange={(e) => setNum(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button onClick={() => search()} disabled={loading} className="btn-noir px-6">
          {loading ? "…" : "Rechercher"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4 text-sm mb-6">{error}</div>
      )}

      {order && (
        <div className="space-y-6">
          {/* ── En-tête ────────────────────────────── */}
          <div className="bg-[#F5F5F5] p-6 rounded">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#C4956A] mb-1">Commande</p>
                <p className="text-xl font-black">{order.numeroCommande}</p>
              </div>
              <span className={`badge-status-${order.status.toLowerCase().replace("_", "-")}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Passée le {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            {order.livreur && (
              <p className="text-xs text-gray-500 mt-1">
                Livreur : <strong>{order.livreur.nom}</strong> — {order.livreur.telephone}
              </p>
            )}
          </div>

          {/* ── Timeline ────────────────────────────── */}
          <div className="flex items-center gap-0">
            {STATUS_ORDER.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className={`relative flex flex-col items-center`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    i <= currentStep
                      ? "bg-[#1A1A1A] border-[#1A1A1A] text-white"
                      : "bg-white border-gray-200 text-gray-300"
                  }`}>
                    {i < currentStep ? "✓" : i + 1}
                  </div>
                  <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-center max-w-[60px]">
                    {STATUS_LABELS[s]}
                  </p>
                </div>
                {i < STATUS_ORDER.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-[#1A1A1A]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* ── Articles ────────────────────────────── */}
          <div>
            <h2 className="font-bold uppercase tracking-wider text-sm mb-3">Articles</h2>
            <div className="divide-y divide-gray-100">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{it.chaussureNom}</span>
                    {it.pointure && <span className="text-gray-500 ml-1">— Pointure {it.pointure}</span>}
                    {it.couleur && <span className="text-gray-400 ml-1">({it.couleur})</span>}
                    <span className="text-gray-400 ml-1">×{it.quantity}</span>
                  </div>
                  <span>{Number(it.totalPrice).toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span>{Number(order.subtotal).toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Livraison {order.deliveryZone ? `(${order.deliveryZone.name})` : ""}</span>
                <span>{Number(order.deliveryFee).toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2">
                <span>Total</span>
                <span className="text-[#C4956A]">{Number(order.total).toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          </div>

          {/* ── Paiement WA ──────────────────────── */}
          {order.canalFinalisation === "WHATSAPP" && order.status === "PRE_CONFIRMEE" && (
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-sm text-green-800 font-semibold mb-2">Finalisation par WhatsApp</p>
              <p className="text-xs text-green-700">Notre équipe va vous contacter sur WhatsApp pour confirmer et procéder au paiement.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SuiviPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Chargement…</div>}>
      <SuiviContent />
    </Suspense>
  );
}
