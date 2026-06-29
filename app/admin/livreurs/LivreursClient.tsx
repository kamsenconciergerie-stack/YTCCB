"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Livreur = {
  id: string;
  nom: string;
  telephone: string;
  whatsappNumber?: string;
  actif: boolean;
  disponible: boolean;
  deliveryZone?: { name: string } | null;
  _count: { orders: number };
};

type Zone = { id: string; name: string };

export function LivreursClient({ livreurs, zones }: { livreurs: Livreur[]; zones: Zone[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: "", telephone: "", whatsappNumber: "", deliveryZoneId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/livreurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setShowForm(false);
      setForm({ nom: "", telephone: "", whatsappNumber: "", deliveryZoneId: "" });
      router.refresh();
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  async function toggleDisponible(id: string, disponible: boolean) {
    await fetch(`/api/admin/livreurs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disponible: !disponible }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">Livreurs</h1>
        <button onClick={() => setShowForm(true)} className="btn-noir text-xs px-4 py-2">+ Ajouter</button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded p-6 mb-6">
          <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Nouveau livreur</h2>
          <div className="grid grid-cols-2 gap-4">
            <input className="input text-sm" placeholder="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <input className="input text-sm" placeholder="Téléphone * (+221…)" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
            <input className="input text-sm" placeholder="WhatsApp (facultatif)" value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} />
            <select className="input text-sm bg-white" value={form.deliveryZoneId} onChange={(e) => setForm({ ...form, deliveryZoneId: e.target.value })}>
              <option value="">Zone de livraison (facultatif)</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="btn-outline text-xs px-4 py-2">Annuler</button>
            <button onClick={handleCreate} disabled={!form.nom || !form.telephone || loading} className="btn-noir text-xs px-4 py-2 disabled:opacity-50">
              {loading ? "Enregistrement…" : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* Table livreurs */}
      <div className="bg-white rounded border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Nom", "Téléphone", "Zone", "Commandes", "Statut", "Dispo"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {livreurs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Aucun livreur.</td></tr>
            ) : livreurs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{l.nom}</td>
                <td className="px-4 py-3 text-gray-600">{l.telephone}</td>
                <td className="px-4 py-3 text-gray-500">{l.deliveryZone?.name ?? "—"}</td>
                <td className="px-4 py-3">{l._count.orders}</td>
                <td className="px-4 py-3">
                  {l.actif
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Actif</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold">Inactif</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleDisponible(l.id, l.disponible)}
                    className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${
                      l.disponible ? "bg-[#25D366] text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {l.disponible ? "Disponible" : "Occupé"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
