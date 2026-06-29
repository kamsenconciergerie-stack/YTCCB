import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { z } from "zod";

const Schema = z.object({
  orderId: z.string().uuid().optional(),
  numeroCommande: z.string().optional(),
  status: z.enum(["PAYE", "EN_PREPARATION", "EN_LIVRAISON", "LIVREE", "EXPIREE", "ANNULEE"]),
});

// PATCH /api/n8n/order-status — appelé par n8n pour mettre à jour le statut
export async function PATCH(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const { orderId, numeroCommande, status } = parsed.data;

  const where = orderId ? { id: orderId } : numeroCommande ? { numeroCommande } : null;
  if (!where) return NextResponse.json({ error: "orderId ou numeroCommande requis" }, { status: 400 });

  const order = await prisma.order.update({
    where,
    data: {
      status,
      ...(status === "PAYE" ? { statutPaiement: "PAYE", paidAt: new Date() } : {}),
      ...(status === "EXPIREE" ? { statutPaiement: "ECHOUE" } : {}),
      ...(status === "LIVREE" ? { deliveredAt: new Date() } : {}),
    },
    select: { id: true, numeroCommande: true, status: true },
  });

  return NextResponse.json({ data: order });
}
