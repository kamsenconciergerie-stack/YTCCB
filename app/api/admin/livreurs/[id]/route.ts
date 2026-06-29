import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { z } from "zod";

const UpdateSchema = z.object({
  nom: z.string().min(2).max(100).optional(),
  telephone: z.string().min(8).max(20).optional(),
  whatsappNumber: z.string().min(8).max(20).optional().nullable(),
  deliveryZoneId: z.string().uuid().optional().nullable(),
  actif: z.boolean().optional(),
  disponible: z.boolean().optional(),
});

type Params = { params: { id: string } };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const livreur = await prisma.livreur.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ data: livreur });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdminSession();
  if (error) return error;

  await prisma.livreur.update({
    where: { id: params.id },
    data: { actif: false },
  });

  return NextResponse.json({ message: "Livreur désactivé" });
}
