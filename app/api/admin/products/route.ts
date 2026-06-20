import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { z } from "zod";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const ProductSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["GROS_OEUVRE", "ETANCHEITE", "CARRELAGE", "PLOMBERIE", "ELECTRICITE", "SANITAIRES", "ELECTROMENAGER", "SOLAIRE"]),
  price: z.number().positive(),
  stockQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  unit: z.string().default("unité"),
  description: z.string().optional(),
  brand: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sku: z.string().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const products = await prisma.product.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, category: true, price: true, stockQty: true, lowStockThreshold: true, unit: true, isActive: true, sku: true, brand: true },
  });

  return NextResponse.json({ data: products });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = ProductSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });

  const slug = slugify(parsed.data.name);

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      slug,
      imageUrl: parsed.data.imageUrl || null,
      description: parsed.data.description || null,
      brand: parsed.data.brand || null,
      sku: parsed.data.sku || null,
    },
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
