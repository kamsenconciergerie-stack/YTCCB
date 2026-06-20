import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function ModifierProduitPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, category: true, price: true, stockQty: true, lowStockThreshold: true, unit: true, description: true, brand: true, imageUrl: true, sku: true, isActive: true },
  });

  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <a href="/admin/catalogue" className="text-sm text-gray-400 hover:text-gray-600">← Catalogue</a>
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>Modifier le produit</h1>
      </div>
      <ProductForm initial={{ ...product, price: Number(product.price), imageUrl: product.imageUrl ?? undefined, description: product.description ?? undefined, brand: product.brand ?? undefined, sku: product.sku ?? undefined }} />
    </div>
  );
}
