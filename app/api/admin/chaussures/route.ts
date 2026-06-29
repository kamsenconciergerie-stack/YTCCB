import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { CreateChaussureSchema, ChaussureFiltresSchema } from "@/lib/validators/chaussure";

// GET /api/admin/chaussures — liste paginée avec filtres
export async function GET(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = ChaussureFiltresSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Filtres invalides" }, { status: 422 });

  const { categorie, q, actif, featured, promo, page, limit, sort, pointure } = parsed.data;

  const where: Record<string, unknown> = {};
  if (categorie) where.categorie = categorie;
  if (actif !== undefined) where.actif = actif;
  if (featured !== undefined) where.featured = featured;
  if (promo) where.prixPromo = { not: null };
  if (q) where.OR = [
    { nom: { contains: q, mode: "insensitive" } },
    { reference: { contains: q, mode: "insensitive" } },
    { marque: { contains: q, mode: "insensitive" } },
  ];

  const orderBy =
    sort === "prix_asc" ? { prix: "asc" as const }
    : sort === "prix_desc" ? { prix: "desc" as const }
    : sort === "nouveautes" ? { createdAt: "desc" as const }
    : { createdAt: "desc" as const };

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
        pointuresDisponibles: true, images: true, actif: true, featured: true,
        sourceImport: true, createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    data: chaussures,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/admin/chaussures — créer une chaussure
export async function POST(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = CreateChaussureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.chaussure.findUnique({
    where: { reference: parsed.data.reference },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: `La référence ${parsed.data.reference} existe déjà` }, { status: 409 });
  }

  const chaussure = await prisma.chaussure.create({
    data: {
      ...parsed.data,
      pointuresDisponibles: parsed.data.pointuresDisponibles ?? [],
      stocksParPointure: parsed.data.stocksParPointure ?? {},
      images: parsed.data.images ?? [],
      dateImport: new Date(),
    },
  });

  return NextResponse.json({ data: chaussure }, { status: 201 });
}
