import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { SearchInput } from "./SearchInput";

export const metadata: Metadata = { title: "Catalogue" };

const CATEGORIES = [
  { label: "Gros œuvre",     value: "GROS_OEUVRE" },
  { label: "Étanchéité",     value: "ETANCHEITE" },
  { label: "Carrelage",      value: "CARRELAGE" },
  { label: "Plomberie",      value: "PLOMBERIE" },
  { label: "Électricité",    value: "ELECTRICITE" },
  { label: "Sanitaires",     value: "SANITAIRES" },
  { label: "Électroménager", value: "ELECTROMENAGER" },
  { label: "Solaire",        value: "SOLAIRE" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string };
}) {
  const category = CATEGORIES.find((c) => c.value === searchParams.category)?.value as Category | undefined;
  const q = searchParams.q?.trim();

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      stockQty: true,
      unit: true,
      imageUrl: true,
      category: true,
    },
  });

  const activeCategory = CATEGORIES.find((c) => c.value === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-display font-bold mb-1" style={{ color: "var(--ccb-green)" }}>
        Catalogue
      </h1>
      <p className="text-gray-500 mb-8">
        {products.length} produit{products.length !== 1 ? "s" : ""}
        {activeCategory ? ` — ${activeCategory.label}` : ""}
        {q ? ` — "${q}"` : ""}
      </p>

      {/* Barre de recherche + filtres catégorie */}
      <div className="flex flex-col gap-4 mb-8">
        <SearchInput defaultValue={q ?? ""} category={category} />
        <div className="flex flex-wrap gap-2">
          <a
            href={q ? `/catalogue?q=${q}` : "/catalogue"}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !category ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={!category ? { backgroundColor: "var(--ccb-green)" } : {}}
          >
            Tous
          </a>
          {CATEGORIES.map((cat) => {
            const href = `/catalogue?category=${cat.value}${q ? `&q=${q}` : ""}`;
            const isActive = category === cat.value;
            return (
              <a
                key={cat.value}
                href={href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={isActive ? { backgroundColor: "var(--ccb-gold)" } : {}}
              >
                {cat.label}
              </a>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">Aucun produit trouvé</p>
          <a href="/catalogue" className="mt-4 inline-block text-sm text-ccb-green-600 underline">
            Voir tout le catalogue
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              stockQty={p.stockQty}
              unit={p.unit}
              imageUrl={p.imageUrl}
              category={p.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
