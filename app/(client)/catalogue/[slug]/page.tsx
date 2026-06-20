import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/components/ProductCard";
import { AddToCartButton } from "./AddToCartButton";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return { title: product?.name ?? "Produit" };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug, isActive: true },
  });

  if (!product) notFound();

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace("+", "") ?? "";
  const waText = encodeURIComponent(
    `Bonjour CCB, je voudrais commander : ${product.name} (réf. ${product.sku ?? product.id})`
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <a href="/catalogue" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-6">
        ← Retour au catalogue
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square bg-ccb-green-50 rounded-2xl flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-9xl opacity-20">
              {CATEGORY_ICONS[product.category] ?? "📦"}
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-col">
          <span
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: "var(--ccb-gold)" }}
          >
            {CATEGORY_LABELS[product.category] ?? product.category}
          </span>

          <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">
            {product.name}
          </h1>

          {product.brand && (
            <p className="text-sm text-gray-500 mb-3">Marque : {product.brand}</p>
          )}

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold" style={{ color: "var(--ccb-green)" }}>
              {formatPrice(product.price)}
            </span>
            <span className="text-gray-400">/ {product.unit}</span>
          </div>

          <p className={`text-sm font-medium mb-4 ${product.stockQty > 0 ? "text-emerald-600" : "text-red-500"}`}>
            {product.stockQty > 0
              ? `${product.stockQty} ${product.unit}${product.stockQty > 1 ? "s" : ""} disponible${product.stockQty > 1 ? "s" : ""}`
              : "Rupture de stock"}
          </p>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          {product.sku && (
            <p className="text-xs text-gray-400 mb-6">Réf : {product.sku}</p>
          )}

          <AddToCartButton
            product={{
              productId: product.id,
              name: product.name,
              price: Number(product.price),
              unit: product.unit,
              slug: product.slug,
            }}
            stockQty={product.stockQty}
          />

          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={`https://wa.me/${waNumber}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary inline-flex items-center justify-center gap-2 py-3 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.532 5.862L.054 23.333a.5.5 0 0 0 .613.613l5.47-1.478A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.513-5.243-1.41l-.375-.214-3.893 1.051 1.051-3.893-.214-.375A9.978 9.978 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Commander sur WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
