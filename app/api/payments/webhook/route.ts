import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

// Payload normalisé envoyé par n8n après vérification HMAC Wave/Orange Money
const N8nPaymentSchema = z.object({
  provider: z.enum(["wave", "orange_money"]),
  transactionId: z.string().min(1).max(255),
  orderReference: z.string().min(1).max(255), // orderNumber ou id
  status: z.enum(["paye", "echec", "en_attente", "inconnu"]),
  amount: z.number().positive().optional(),
});

const STATUS_MAP = {
  paye: "COMPLETED",
  echec: "FAILED",
  en_attente: "PENDING",
  inconnu: "PENDING",
} as const;

const PROVIDER_MAP = {
  wave: "WAVE",
  orange_money: "ORANGE_MONEY",
} as const;

// POST /api/payments/webhook — webhook unifié appelé par n8n après vérification signature
// (les webhooks /wave et /orange-money reçoivent directement depuis les providers)
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = N8nPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { provider, transactionId, orderReference, status, amount } = parsed.data;
  const newStatus = STATUS_MAP[status];
  const dbProvider = PROVIDER_MAP[provider];
  const idempotencyKey = `n8n_${provider}_${transactionId}`;

  const order = await prisma.order.findFirst({
    where: { OR: [{ orderNumber: orderReference }, { id: orderReference }] },
    select: { id: true, orderNumber: true, total: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Commande introuvable", orderReference },
      { status: 404 }
    );
  }

  const existing = await prisma.payment.findFirst({
    where: { OR: [{ idempotencyKey }, { transactionRef: transactionId }] },
    select: { id: true, status: true },
  });

  const now = new Date();

  if (existing) {
    if (existing.status === "COMPLETED" || existing.status === "FAILED") {
      return NextResponse.json({ received: true, skipped: true });
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: existing.id },
        data: {
          status: newStatus,
          transactionRef: transactionId,
          paidAt: newStatus === "COMPLETED" ? now : null,
        },
      }),
      ...(newStatus === "COMPLETED"
        ? [
            prisma.order.update({
              where: { id: order.id },
              data: { status: "CONFIRMED", confirmedAt: now },
            }),
          ]
        : []),
    ]);
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: dbProvider,
          status: newStatus,
          amount: amount ?? Number(order.total),
          transactionRef: transactionId,
          idempotencyKey,
          paidAt: newStatus === "COMPLETED" ? now : null,
        },
      });

      if (newStatus === "COMPLETED") {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED", confirmedAt: now },
        });
      }
    });
  }

  return NextResponse.json({ received: true, status: newStatus });
}
