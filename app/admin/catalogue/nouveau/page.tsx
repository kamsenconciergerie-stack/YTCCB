import type { Metadata } from "next";
import { ProductForm } from "../ProductForm";

export const metadata: Metadata = { title: "Nouveau produit — Admin CCB" };

export default function NouveauProduitPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <a href="/admin/catalogue" className="text-sm text-gray-400 hover:text-gray-600">← Catalogue</a>
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>Nouveau produit</h1>
      </div>
      <ProductForm />
    </div>
  );
}
