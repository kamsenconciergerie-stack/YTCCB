import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

const UpsertProductSchema = z.object({
  externalRef: z.string().min(1).max(500),
  name: z.string().min(2).max(200),
  price: z.number().positive(),
  imageUrl: z.string().url().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  lastSyncedAt: z.string().datetime().optional(),
  source: z.string().max(100).optional(),
});

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 190);
}

// POST /api/products/upsert — créer ou mettre à jour un produit par externalRef (sync n8n)
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = UpsertProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { externalRef, name, price, imageUrl, description, lastSyncedAt } = parsed.data;
  const syncedAt = lastSyncedAt ? new Date(lastSyncedAt) : new Date();

  const existing = await prisma.product.findFirst({
    where: { externalRef },
    select: { id: true },
  });

  let product;

  if (existing) {
    product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name,
        price,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(description !== undefined ? { description } : {}),
        lastSyncedAt: syncedAt,
      },
      select: { id: true, name: true, slug: true, price: true, externalRef: true, updatedAt: true },
    });
  } else {
    // Générer un slug unique à partir du nom
    const baseSlug = toSlug(name);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    product = await prisma.product.create({
      data: {
        name,
        slug,
        price,
        category: "GROS_OEUVRE", // Catégorie par défaut — à corriger manuellement en admin
        imageUrl: imageUrl ?? null,
        description: description ?? null,
        externalRef,
        lastSyncedAt: syncedAt,
      },
      select: { id: true, name: true, slug: true, price: true, externalRef: true, updatedAt: true },
    });
  }

  return NextResponse.json({ data: product, created: !existing });
}
