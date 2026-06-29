import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { z } from "zod";

const LivreurSchema = z.object({
  nom: z.string().min(2).max(100),
  telephone: z.string().min(8).max(20),
  whatsappNumber: z.string().min(8).max(20).optional(),
  deliveryZoneId: z.string().uuid().optional().nullable(),
  actif: z.boolean().default(true),
  disponible: z.boolean().default(true),
});

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const livreurs = await prisma.livreur.findMany({
    orderBy: [{ actif: "desc" }, { nom: "asc" }],
    include: {
      deliveryZone: { select: { name: true } },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({ data: livreurs });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = LivreurSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const livreur = await prisma.livreur.create({ data: parsed.data });
  return NextResponse.json({ data: livreur }, { status: 201 });
}
