"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "FEMME",       label: "Femme" },
  { value: "HOMME",       label: "Homme" },
  { value: "ENFANT",      label: "Enfant" },
  { value: "SPORT",       label: "Sport" },
  { value: "SANDALES",    label: "Sandales" },
  { value: "BOTTES",      label: "Bottes & Bottines" },
  { value: "ESCARPINS",   label: "Escarpins" },
  { value: "SNEAKERS",    label: "Sneakers & Baskets" },
  { value: "ACCESSOIRES", label: "Accessoires" },
];

type ChaussureData = {
  id?: string;
  reference?: string;
  nom?: string;
  marque?: string;
  categorie?: string;
  couleur?: string;
  prix?: number;
  prixPromo?: number | null;
  stockTotal?: number;
  pointuresDisponibles?: string[];
  description?: string;
  images?: string[];
  actif?: boolean;
  featured?: boolean;
};

export function ChaussureForm({ chaussure }: { chaussure?: ChaussureData }) {
  const router = useRouter();
  const isEdit = !!chaussure?.id;

  const [form, setForm] = useState({
    reference: chaussure?.reference ?? "",
    nom: chaussure?.nom ?? "",
    marque: chaussure?.marque ?? "",
    categorie: chaussure?.categorie ?? "ESCARPINS",
    couleur: chaussure?.couleur ?? "",
    prix: chaussure?.prix?.toString() ?? "",
    prixPromo: chaussure?.prixPromo?.toString() ?? "",
    stockTotal: chaussure?.stockTotal?.toString() ?? "0",
    pointuresDisponibles: (chaussure?.pointuresDisponibles ?? []).join(", "),
    description: chaussure?.description ?? "",
    images: (chaussure?.images ?? []).join("\n"),
    actif: chaussure?.actif ?? true,
    featured: chaussure?.featured ?? false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const payload = {
      reference: form.reference,
      nom: form.nom,
      marque: form.marque || null,
      categorie: form.categorie,
      couleur: form.couleur || null,
      prix: parseFloat(form.prix),
      prixPromo: form.prixPromo ? parseFloat(form.prixPromo) : null,
      stockTotal: parseInt(form.stockTotal) || 0,
      pointuresDisponibles: form.pointuresDisponibles.split(",").map((p) => p.trim()).filter(Boolean),
      description: form.description || null,
      images: form.images.split("\n").map((u) => u.trim()).filter(Boolean),
      actif: form.actif,
      featured: form.featured,
    };

    const url = isEdit ? `/api/admin/chaussures/${chaussure!.id}` : "/api/admin/chaussures";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      router.push("/admin/catalogue");
      router.refresh();
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Référence *</label>
          <input required className="input text-sm" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="MTS-2026-001" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Catégorie *</label>
          <select required className="input text-sm bg-white" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Nom *</label>
        <input required className="input text-sm" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Escarpin Élégance Noir" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Marque</label>
          <input className="input text-sm" value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} placeholder="MTS Collection" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Couleur</label>
          <input className="input text-sm" value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} placeholder="Noir, Or, Blanc…" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Prix (FCFA) *</label>
          <input required type="number" className="input text-sm" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} placeholder="25000" min="0" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Prix promo</label>
          <input type="number" className="input text-sm" value={form.prixPromo} onChange={(e) => setForm({ ...form, prixPromo: e.target.value })} placeholder="Optionnel" min="0" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Stock total</label>
          <input type="number" className="input text-sm" value={form.stockTotal} onChange={(e) => setForm({ ...form, stockTotal: e.target.value })} min="0" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Pointures disponibles</label>
        <input className="input text-sm" value={form.pointuresDisponibles} onChange={(e) => setForm({ ...form, pointuresDisponibles: e.target.value })} placeholder="36, 37, 38, 39, 40, 41" />
        <p className="text-xs text-gray-400 mt-1">Séparées par des virgules</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Description</label>
        <textarea className="input text-sm h-24 resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description du produit…" />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1">URLs images</label>
        <textarea className="input text-sm h-20 resize-none font-mono text-xs" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://…&#10;https://… (une URL par ligne)" />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} className="w-4 h-4" />
          Actif
        </label>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4" />
          ⭐ Mis en avant (featured)
        </label>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn-outline text-xs px-6 py-3">Annuler</button>
        <button type="submit" disabled={loading} className="btn-noir text-xs px-6 py-3 disabled:opacity-50">
          {loading ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer la chaussure"}
        </button>
      </div>
    </form>
  );
}
