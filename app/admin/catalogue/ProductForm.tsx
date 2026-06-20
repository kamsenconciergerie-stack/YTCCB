"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "GROS_OEUVRE", label: "Gros œuvre" },
  { value: "ETANCHEITE", label: "Étanchéité" },
  { value: "CARRELAGE", label: "Carrelage" },
  { value: "PLOMBERIE", label: "Plomberie" },
  { value: "ELECTRICITE", label: "Électricité" },
  { value: "SANITAIRES", label: "Sanitaires" },
  { value: "ELECTROMENAGER", label: "Électroménager" },
  { value: "SOLAIRE", label: "Solaire" },
];

interface ProductData {
  id?: string;
  name: string;
  category: string;
  price: number;
  stockQty: number;
  lowStockThreshold: number;
  unit: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  sku?: string;
  isActive: boolean;
}

export function ProductForm({ initial }: { initial?: ProductData }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProductData>({
    name: initial?.name ?? "",
    category: initial?.category ?? "GROS_OEUVRE",
    price: initial?.price ?? 0,
    stockQty: initial?.stockQty ?? 0,
    lowStockThreshold: initial?.lowStockThreshold ?? 5,
    unit: initial?.unit ?? "unité",
    description: initial?.description ?? "",
    brand: initial?.brand ?? "",
    imageUrl: initial?.imageUrl ?? "",
    sku: initial?.sku ?? "",
    isActive: initial?.isActive ?? true,
  });

  function set(field: keyof ProductData, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const url = isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), stockQty: Number(form.stockQty), lowStockThreshold: Number(form.lowStockThreshold) }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur"); return; }
      router.push("/admin/catalogue");
      router.refresh();
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ccb-green-600/40";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
          <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="ex : Ciment Portland 50kg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls + " bg-white"}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
            <input type="text" value={form.unit} onChange={(e) => set("unit", e.target.value)} className={inputCls} placeholder="unité, sac, m², kg..." />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) *</label>
            <input type="number" required min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input type="number" min="0" value={form.stockQty} onChange={(e) => set("stockQty", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seuil alerte</label>
            <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
            <input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} placeholder="Optionnel" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Référence</label>
            <input type="text" value={form.sku} onChange={(e) => set("sku", e.target.value)} className={inputCls} placeholder="Optionnel" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL image</label>
          <input type="url" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} className={inputCls} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls + " resize-none"} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 rounded" />
          <span className="font-medium text-gray-700">Produit actif (visible sur le catalogue)</span>
        </label>
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-gold px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
          {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer le produit"}
        </button>
        <a href="/admin/catalogue" className="px-6 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg">
          Annuler
        </a>
      </div>
    </form>
  );
}
