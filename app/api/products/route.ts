import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import {
  CreateProductSchema,
  ProductFiltersSchema,
} from "@/lib/validators/product";

// GET /api/products — liste paginée avec filtres
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const parsed = ProductFiltersSchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    isActive: searchParams.get("isActive") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { category, isActive, search, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    ...(category ? { category } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        price: true,
        stockQty: true,
        lowStockThreshold: true,
        imageUrl: true,
        unit: true,
        sku: true,
        brand: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/products — création produit (protégé API key)
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Vérifier unicité du slug
  const existing = await prisma.product.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, price: parsed.data.price },
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
