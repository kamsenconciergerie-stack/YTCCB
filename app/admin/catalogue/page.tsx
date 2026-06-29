import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { ImportCsvButton } from "./ImportCsvButton";

export const metadata: Metadata = { title: "Catalogue — Admin MTS" };

const CAT_LABELS: Record<string, string> = {
  FEMME: "Femme", HOMME: "Homme", ENFANT: "Enfant", SPORT: "Sport",
  SANDALES: "Sandales", BOTTES: "Bottes", ESCARPINS: "Escarpins",
  SNEAKERS: "Sneakers", ACCESSOIRES: "Accessoires",
};

type Props = { searchParams?: { categorie?: string; q?: string; page?: string } };

export default async function CataloguePage({ searchParams }: Props) {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const cat = searchParams?.categorie ?? "";
  const q = searchParams?.q ?? "";
  const page = parseInt(searchParams?.page ?? "1", 10);
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (cat) where.categorie = cat;
  if (q) where.OR = [
    { nom: { contains: q, mode: "insensitive" } },
    { reference: { contains: q, mode: "insensitive" } },
    { marque: { contains: q, mode: "insensitive" } },
  ];

  const [total, chaussures] = await Promise.all([
    prisma.chaussure.count({ where }),
    prisma.chaussure.findMany({
      where,
      orderBy: [{ actif: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, reference: true, nom: true, marque: true, categorie: true,
        couleur: true, prix: true, prixPromo: true, stockTotal: true,
        pointuresDisponibles: true, actif: true, featured: true, sourceImport: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Catalogue</h1>
          <p className="text-sm text-gray-500">{total} article{total > 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <ImportCsvButton />
          <Link href="/admin/catalogue/nouveau" className="btn-noir text-xs px-4 py-2">
            + Ajouter
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <form className="flex flex-wrap gap-2 mb-6" method="GET">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher nom / ref / marque…"
          className="input flex-1 max-w-xs text-sm py-2"
        />
        <select name="categorie" defaultValue={cat} className="input max-w-[180px] text-sm py-2 bg-white">
          <option value="">Toutes catégories</option>
          {Object.entries(CAT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button type="submit" className="btn-noir text-xs px-4 py-2">Filtrer</button>
        {(q || cat) && <Link href="/admin/catalogue" className="btn-outline text-xs px-4 py-2">Reset</Link>}
      </form>

      {/* Table */}
      <div className="bg-white rounded border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Réf", "Article", "Catégorie", "Prix", "Stock", "Pointures", "Statut", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {chaussures.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Aucun article trouvé.</td></tr>
            ) : chaussures.map((ch) => (
              <tr key={ch.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{ch.reference}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#1A1A1A]">{ch.nom}</div>
                  {ch.marque && <div className="text-xs text-gray-400">{ch.marque}</div>}
                  {ch.couleur && <div className="text-xs text-gray-300">{ch.couleur}</div>}
                </td>
                <td className="px-4 py-3 text-xs">{CAT_LABELS[ch.categorie] ?? ch.categorie}</td>
                <td className="px-4 py-3">
                  {ch.prixPromo ? (
                    <div>
                      <div className="font-bold text-[#C4956A]">{Number(ch.prixPromo).toLocaleString("fr-FR")} F</div>
                      <div className="text-xs text-gray-400 line-through">{Number(ch.prix).toLocaleString("fr-FR")} F</div>
                    </div>
                  ) : (
                    <span className="font-semibold">{Number(ch.prix).toLocaleString("fr-FR")} F</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={ch.stockTotal <= 3 ? "text-red-600 font-bold" : "font-semibold"}>
                    {ch.stockTotal}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(ch.pointuresDisponibles as string[]).slice(0, 5).map((p) => (
                      <span key={p} className="text-[9px] border border-gray-200 px-1 py-0.5 text-gray-500">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {ch.actif
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Actif</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-semibold">Inactif</span>
                  }
                  {ch.featured && <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">⭐</span>}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/catalogue/${ch.id}`} className="text-xs text-[#C4956A] font-semibold hover:underline">
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/catalogue?${cat ? `categorie=${cat}&` : ""}${q ? `q=${q}&` : ""}page=${p}`}
              className={`w-9 h-9 flex items-center justify-center text-xs font-bold border transition-colors ${
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
