import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWaveWebhookSignature, WaveWebhookPayload } from "@/lib/payment/wave";

// POST /api/payments/webhook/wave
// Reçoit les notifications de paiement Wave (complet ou erreur)
export async function POST(request: NextRequest) {
  const signature = request.headers.get("wave-signature") ?? "";
  const rawBody   = await request.text();

  // Vérification signature HMAC — rejeter silencieusement si invalide
  if (!verifyWaveWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let payload: WaveWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // Trouver le paiement par l'ID de session Wave (providerPaymentId)
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: payload.id },
    include: { order: { select: { id: true, orderNumber: true } } },
  });

  if (!payment) {
    // Inconnu — on répond 200 pour éviter les re-tentatives Wave
    return NextResponse.json({ received: true });
  }

  // Idempotence : ignorer si déjà traité
  if (payment.status === "COMPLETED" || payment.status === "FAILED") {
    return NextResponse.json({ received: true, skipped: true });
  }

  const newStatus  = payload.status === "complete" ? "COMPLETED" : "FAILED";
  const now        = new Date();

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:         newStatus,
        transactionRef: payload.id,
        webhookPayload: payload as never,
        paidAt:         newStatus === "COMPLETED" ? now : null,
      },
    }),
    // Si paiement réussi → confirmer la commande
    ...(newStatus === "COMPLETED"
      ? [
          prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED", confirmedAt: now },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ received: true });
}
