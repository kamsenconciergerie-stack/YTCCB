import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWaveWebhookSignature, WaveWebhookPayload } from "@/lib/payment/wave";

// POST /api/payments/webhook/wave
export async function POST(request: NextRequest) {
  const signature = request.headers.get("wave-signature") ?? "";
  const rawBody = await request.text();

  if (!verifyWaveWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let payload: WaveWebhookPayload;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: payload.id },
    include: { order: { select: { id: true, numeroCommande: true, customer: { select: { whatsappNumber: true } } } } },
  });

  if (!payment) return NextResponse.json({ received: true });

  const alreadyDone = await prisma.payment.findFirst({
    where: { idempotencyKey: payment.idempotencyKey, paidAt: { not: null } },
    select: { id: true },
  });
  if (alreadyDone) return NextResponse.json({ received: true, skipped: true });

  const isSuccess = payload.status === "complete";
  const now = new Date();

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        transactionRef: payload.id,
        webhookPayload: payload as never,
        paidAt: isSuccess ? now : null,
      },
    }),
    ...(isSuccess
      ? [
          prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: "PAYE",
              statutPaiement: "PAYE",
              paidAt: now,
            },
          }),
        ]
      : [
          prisma.order.update({
            where: { id: payment.orderId },
            data: { statutPaiement: "ECHOUE" },
          }),
        ]),
  ]);

  return NextResponse.json({ received: true });
}
