import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const chaussure = await prisma.chaussure.findFirst({
    where: { id: params.id, actif: true },
  });

  if (!chaussure) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  return NextResponse.json({ data: chaussure });
}
