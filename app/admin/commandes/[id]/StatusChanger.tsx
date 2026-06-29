"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMEE: "Pré-confirmée", PAYE: "Payée",
  EN_PREPARATION: "En préparation", EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée", EXPIREE: "Expirée", ANNULEE: "Annulée",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PRE_CONFIRMEE:  ["PAYE", "ANNULEE"],
  PAYE:           ["EN_PREPARATION", "ANNULEE"],
  EN_PREPARATION: ["EN_LIVRAISON", "ANNULEE"],
  EN_LIVRAISON:   ["LIVREE", "ANNULEE"],
  LIVREE: [], EXPIREE: [], ANNULEE: [],
};

type Livreur = { id: string; nom: string; disponible: boolean };

export function StatusChanger({
  orderId,
  currentStatus,
  livreurs = [],
}: {
  orderId: string;
  currentStatus: string;
  livreurs?: Livreur[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [livreurId, setLivreurId] = useState("");

  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  async function handleChange(newStatus: string) {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(cancelReason ? { cancelReason } : {}),
          ...(livreurId ? { livreurId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      router.refresh();
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  if (allowed.length === 0) return null;

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Changer le statut</p>

      {allowed.includes("EN_LIVRAISON") && livreurs.length > 0 && (
        <div className="mb-3">
          <label className="text-xs font-semibold mb-1 block">Assigner un livreur</label>
          <select className="input text-sm bg-white max-w-xs" value={livreurId} onChange={(e) => setLivreurId(e.target.value)}>
            <option value="">Sélectionner…</option>
            {livreurs.filter((l) => l.disponible).map((l) => (
              <option key={l.id} value={l.id}>{l.nom}</option>
            ))}
          </select>
        </div>
      )}

      {allowed.includes("ANNULEE") && (
        <input
          className="input text-sm mb-3 max-w-sm"
          placeholder="Raison d'annulation (si annulée)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => (
          <button
            key={s}
            disabled={loading}
            onClick={() => handleChange(s)}
            className={`text-xs px-4 py-2 font-semibold transition-colors disabled:opacity-50 border ${
              s === "ANNULEE"
                ? "border-red-300 text-red-600 hover:bg-red-50"
                : "border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
            }`}
          >
            {loading ? "…" : `→ ${STATUS_LABELS[s] ?? s}`}
          </button>
        ))}
      </div>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}
