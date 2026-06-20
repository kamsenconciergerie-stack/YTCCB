import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Catalogue — Admin CCB" };
export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  GROS_OEUVRE: "Gros œuvre", ETANCHEITE: "Étanchéité", CARRELAGE: "Carrelage",
  PLOMBERIE: "Plomberie", ELECTRICITE: "Électricité", SANITAIRES: "Sanitaires",
  ELECTROMENAGER: "Électroménager", SOLAIRE: "Solaire",
};

export default async function CatalogueAdminPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true, price: true, stockQty: true, lowStockThreshold: true, unit: true, isActive: true, sku: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>Catalogue</h1>
        <a href="/admin/catalogue/nouveau" className="btn-gold text-sm px-4 py-2">+ Nouveau produit</a>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Produit</th>
                <th className="px-5 py-3 text-left">Catégorie</th>
                <th className="px-5 py-3 text-right">Prix</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.sku && <p className="text-xs text-gray-400">Réf. {p.sku}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatPrice(p.price)}<span className="text-gray-400 font-normal">/{p.unit}</span></td>
                  <td className="px-5 py-3 text-right">
                    <span className={p.stockQty <= p.lowStockThreshold && p.stockQty > 0 ? "text-orange-500 font-semibold" : p.stockQty === 0 ? "text-red-500 font-semibold" : "text-gray-700"}>
                      {p.stockQty}
                    </span>
                    {p.stockQty <= p.lowStockThreshold && p.stockQty > 0 && <span className="ml-1 text-xs text-orange-400">⚠ bas</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                      {p.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <a href={`/admin/catalogue/${p.id}/modifier`} className="text-xs font-medium hover:underline" style={{ color: "var(--ccb-gold)" }}>
                      Modifier →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
