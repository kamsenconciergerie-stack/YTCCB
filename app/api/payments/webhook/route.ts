import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

const N8nPaymentSchema = z.object({
  provider: z.enum(["wave", "orange_money"]),
  transactionId: z.string().min(1).max(255),
  orderReference: z.string().min(1).max(255),
  status: z.enum(["paye", "echec", "en_attente", "inconnu"]),
  amount: z.number().positive().optional(),
});

const PROVIDER_MAP = { wave: "WAVE", orange_money: "ORANGE_MONEY" } as const;

// POST /api/payments/webhook — webhook unifié appelé par n8n
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }); }

  const parsed = N8nPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const { provider, transactionId, orderReference, status, amount } = parsed.data;
  const isPaid = status === "paye";
  const dbProvider = PROVIDER_MAP[provider];
  const idempotencyKey = `n8n_${provider}_${transactionId}`;

  const order = await prisma.order.findFirst({
    where: { OR: [{ numeroCommande: orderReference }, { id: orderReference }] },
    select: { id: true, numeroCommande: true, total: true },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable", orderReference }, { status: 404 });

  const existing = await prisma.payment.findFirst({
    where: { OR: [{ idempotencyKey }, { transactionRef: transactionId }] },
    select: { id: true, paidAt: true },
  });

  const now = new Date();

  if (existing) {
    if (existing.paidAt) return NextResponse.json({ received: true, skipped: true });
    if (isPaid) {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: existing.id }, data: { transactionRef: transactionId, paidAt: now } }),
        prisma.order.update({ where: { id: order.id }, data: { status: "PAYE", statutPaiement: "PAYE", paidAt: now } }),
      ]);
    }
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: dbProvider,
          amount: amount ?? Number(order.total),
          transactionRef: transactionId,
          idempotencyKey,
          paidAt: isPaid ? now : null,
        },
      });
      if (isPaid) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAYE", statutPaiement: "PAYE", paidAt: now },
        });
      }
    });
  }

  return NextResponse.json({ received: true, status: isPaid ? "PAYE" : "EN_ATTENTE" });
}
