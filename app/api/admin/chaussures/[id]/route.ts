import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { UpdateChaussureSchema } from "@/lib/validators/chaussure";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const chaussure = await prisma.chaussure.findUnique({
    where: { id: params.id },
  });
  if (!chaussure) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json({ data: chaussure });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = UpdateChaussureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  if (parsed.data.reference) {
    const conflict = await prisma.chaussure.findFirst({
      where: { reference: parsed.data.reference, NOT: { id: params.id } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: `Référence ${parsed.data.reference} déjà utilisée` }, { status: 409 });
    }
  }

  const chaussure = await prisma.chaussure.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ data: chaussure });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const inUse = await prisma.orderItem.findFirst({
    where: { chaussureId: params.id },
    select: { id: true },
  });
  if (inUse) {
    await prisma.chaussure.update({
      where: { id: params.id },
      data: { actif: false },
    });
    return NextResponse.json({ message: "Chaussure désactivée (commandes existantes)" });
  }

  await prisma.chaussure.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Chaussure supprimée" });
}
