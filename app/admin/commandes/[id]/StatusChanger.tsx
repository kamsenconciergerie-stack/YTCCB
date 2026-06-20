"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMED: "Pré-confirmée", CONFIRMED: "Confirmée",
  IN_PREPARATION: "En préparation", IN_DELIVERY: "En livraison",
  DELIVERED: "Livrée", CANCELLED: "Annulée",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PRE_CONFIRMED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PREPARATION", "CANCELLED"],
  IN_PREPARATION: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], CANCELLED: [],
};

const TRANSITION_LABELS: Record<string, string> = {
  CONFIRMED: "✓ Confirmer", IN_PREPARATION: "▶ Mettre en préparation",
  IN_DELIVERY: "🚚 Mettre en livraison", DELIVERED: "✓ Marquer livrée",
  CANCELLED: "✕ Annuler",
};

const TRANSITION_STYLE: Record<string, string> = {
  CONFIRMED: "bg-blue-600 hover:bg-blue-700 text-white",
  IN_PREPARATION: "bg-purple-600 hover:bg-purple-700 text-white",
  IN_DELIVERY: "bg-orange-500 hover:bg-orange-600 text-white",
  DELIVERED: "bg-green-600 hover:bg-green-700 text-white",
  CANCELLED: "bg-red-100 hover:bg-red-200 text-red-700",
};

export function StatusChanger({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const transitions = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  async function changeStatus(newStatus: string) {
    setLoading(newStatus);
    setError("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Erreur"); return; }
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(null);
    }
  }

  if (transitions.length === 0) return null;

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">Changer le statut</h3>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {transitions.map((t) => (
          <button
            key={t}
            onClick={() => changeStatus(t)}
            disabled={loading !== null}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${TRANSITION_STYLE[t] ?? "bg-gray-100 text-gray-700"}`}
          >
            {loading === t ? "..." : TRANSITION_LABELS[t] ?? STATUS_LABELS[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
