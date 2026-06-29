import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ChaussureFiltresSchema } from "@/lib/validators/chaussure";

// GET /api/chaussures — catalogue public
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = ChaussureFiltresSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Paramètres invalides" }, { status: 422 });

  const { categorie, q, promo, featured, page, limit, sort, pointure, prixMin, prixMax } = parsed.data;

  const where: Record<string, unknown> = { actif: true };
  if (categorie) where.categorie = categorie;
  if (promo) where.prixPromo = { not: null };
  if (featured) where.featured = true;
  if (prixMin || prixMax) where.prix = { ...(prixMin ? { gte: prixMin } : {}), ...(prixMax ? { lte: prixMax } : {}) };
  if (q) where.OR = [
    { nom: { contains: q, mode: "insensitive" } },
    { marque: { contains: q, mode: "insensitive" } },
    { couleur: { contains: q, mode: "insensitive" } },
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
        id: true, reference: true, nom: true, marque: true, categorie: true,
        couleur: true, prix: true, prixPromo: true, stockTotal: true,
        pointuresDisponibles: true, images: true, featured: true,
      },
    }),
  ]);

  // Filtrage local par pointure (JSON field non filtrable côté SQL facilement)
  const filtered = pointure
    ? chaussures.filter((c) => (c.pointuresDisponibles as string[]).includes(pointure))
    : chaussures;

  return NextResponse.json({
    data: filtered,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
