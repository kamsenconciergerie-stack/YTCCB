import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(["GROS_OEUVRE", "ETANCHEITE", "CARRELAGE", "PLOMBERIE", "ELECTRICITE", "SANITAIRES", "ELECTROMENAGER", "SOLAIRE"]).optional(),
  price: z.number().positive().optional(),
  stockQty: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  description: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  sku: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 422 });

  const product = await prisma.product.update({
    where: { id: params.id },
    data: { ...parsed.data, imageUrl: parsed.data.imageUrl === "" ? null : parsed.data.imageUrl },
  });

  return NextResponse.json({ data: product });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;

  // Soft delete — désactivation
  await prisma.product.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
