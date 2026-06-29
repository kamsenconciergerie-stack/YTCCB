import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Boutique | Mor Talla Sandaga",
  description: "Toutes nos chaussures — escarpins, sandales, bottes, sneakers et plus.",
};

const CATEGORIES = [
  { label: "Tout", slug: "" },
  { label: "Escarpins", slug: "ESCARPINS" },
  { label: "Sandales", slug: "SANDALES" },
  { label: "Bottes", slug: "BOTTES" },
  { label: "Sneakers", slug: "SNEAKERS" },
  { label: "Femme", slug: "FEMME" },
  { label: "Homme", slug: "HOMME" },
  { label: "Enfant", slug: "ENFANT" },
  { label: "Sport", slug: "SPORT" },
  { label: "Accessoires", slug: "ACCESSOIRES" },
];

type Props = { searchParams?: { categorie?: string; sort?: string; q?: string; page?: string } };

export default async function CataloguePage({ searchParams }: Props) {
  const cat = searchParams?.categorie ?? "";
  const sort = searchParams?.sort ?? "";
  const q = searchParams?.q ?? "";
  const page = parseInt(searchParams?.page ?? "1", 10);
  const limit = 20;

  const where: Record<string, unknown> = { actif: true };
  if (cat) where.categorie = cat;
  if (q) where.OR = [
    { nom: { contains: q, mode: "insensitive" } },
    { marque: { contains: q, mode: "insensitive" } },
  ];

  const orderBy =
    sort === "prix_asc"   ? { prix: "asc" as const }
    : sort === "prix_desc"  ? { prix: "desc" as const }
    : sort === "nouveautes" ? { createdAt: "desc" as const }
    : { featured: "desc" as const };

  const [total, chaussures] = await Promise.all([
    prisma.chaussure.count({ where }),
    prisma.chaussure.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, nom: true, marque: true, categorie: true, couleur: true,
        prix: true, prixPromo: true, images: true, pointuresDisponibles: true, featured: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-[#C4956A]">Accueil</Link>
        <span className="mx-2">›</span>
        <span>Boutique</span>
      </nav>

      <h1 className="section-title mb-2">Boutique</h1>
      <p className="section-subtitle">{total} article{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}</p>

      {/* ── Filtres catégorie ──────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/catalogue${c.slug ? `?categorie=${c.slug}` : ""}`}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              cat === c.slug
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "border-gray-200 text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {/* ── Tri ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs text-gray-400">{total} résultat{total > 1 ? "s" : ""}</span>
        <div className="flex gap-2">
          {[
            { label: "Sélection", val: "" },
            { label: "Nouveautés", val: "nouveautes" },
            { label: "Prix ↑", val: "prix_asc" },
            { label: "Prix ↓", val: "prix_desc" },
          ].map((o) => (
            <Link
              key={o.val}
              href={`/catalogue?${cat ? `categorie=${cat}&` : ""}sort=${o.val}`}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                sort === o.val ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-gray-200 hover:border-[#1A1A1A]"
              }`}
            >
              {o.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Grille produits ──────────────────────── */}
      {chaussures.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="text-6xl block mb-4">👠</span>
          <p>Aucun article trouvé pour cette sélection.</p>
          <Link href="/catalogue" className="btn-noir mt-4 inline-flex">Voir tout le catalogue</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {chaussures.map((ch) => (
            <Link key={ch.id} href={`/catalogue/${ch.id}`} className="group block">
              <div className="relative overflow-hidden bg-[#F5F5F5] aspect-square mb-3">
                {ch.prixPromo && <span className="badge-promo">Promo</span>}
                {(ch.images as string[])?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(ch.images as string[])[0]}
                    alt={ch.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">👠</div>
                )}
              </div>
              {ch.marque && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{ch.marque}</p>
              )}
              <p className="font-semibold text-[#1A1A1A] text-sm line-clamp-2 mt-0.5">{ch.nom}</p>
              {ch.couleur && <p className="text-xs text-gray-400">{ch.couleur}</p>}
              <div className="flex items-baseline gap-2 mt-1">
                {ch.prixPromo ? (
                  <>
                    <span className="font-bold text-[#C4956A]">{Number(ch.prixPromo).toLocaleString("fr-FR")} FCFA</span>
                    <span className="text-xs text-gray-400 line-through">{Number(ch.prix).toLocaleString("fr-FR")}</span>
                  </>
                ) : (
                  <span className="font-bold">{Number(ch.prix).toLocaleString("fr-FR")} FCFA</span>
                )}
              </div>
              {(ch.pointuresDisponibles as string[])?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(ch.pointuresDisponibles as string[]).slice(0, 5).map((p) => (
                    <span key={p} className="text-[9px] border border-gray-200 px-1.5 py-0.5 text-gray-500">{p}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/catalogue?${cat ? `categorie=${cat}&` : ""}${sort ? `sort=${sort}&` : ""}page=${p}`}
              className={`w-10 h-10 flex items-center justify-center text-sm font-semibold border transition-colors ${
                p === page ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-gray-200 hover:border-[#1A1A1A]"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
