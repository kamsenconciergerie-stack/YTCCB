import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { AssignLeadSchema } from "@/lib/validators/lead";

// PATCH /api/leads/:id/assign — assigner un lead à un commercial
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = AssignLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { salesRepId } = parsed.data;

  // Vérifier que le lead et le commercial existent
  const [lead, salesRep] = await Promise.all([
    prisma.lead.findUnique({ where: { id: params.id }, select: { id: true } }),
    prisma.salesRep.findUnique({ where: { id: salesRepId }, select: { id: true, name: true } }),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  if (!salesRep) return NextResponse.json({ error: "Commercial introuvable" }, { status: 404 });

  // Transaction : désassigner l'ancien + créer la nouvelle assignation
  const assignment = await prisma.$transaction(async (tx) => {
    // Désactiver l'assignation courante si elle existe
    await tx.leadAssignment.updateMany({
      where: { leadId: params.id, isCurrent: true },
      data: { isCurrent: false, unassignedAt: new Date() },
    });

    // Créer la nouvelle assignation
    return tx.leadAssignment.create({
      data: {
        leadId: params.id,
        salesRepId,
        isCurrent: true,
      },
      include: {
        salesRep: { select: { id: true, name: true, whatsappNumber: true } },
      },
    });
  });

  return NextResponse.json({ data: assignment });
}
