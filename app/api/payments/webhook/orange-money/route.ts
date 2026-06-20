import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyOrangeMoneyWebhook,
  OrangeMoneyWebhookPayload,
} from "@/lib/payment/orange-money";

// POST /api/payments/webhook/orange-money
// Reçoit les notifications de paiement Orange Money
export async function POST(request: NextRequest) {
  let payload: OrangeMoneyWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  // Le pay_token identifie le paiement dans notre base
  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: payload.pay_token },
    include: { order: { select: { id: true, orderNumber: true } } },
  });

  if (!payment) {
    return NextResponse.json({ received: true });
  }

  // Idempotence
  if (payment.status === "COMPLETED" || payment.status === "FAILED") {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Vérification du notif_token stocké lors de l'initiation
  const storedNotifToken = payment.transactionRef ?? "";
  const isValid = verifyOrangeMoneyWebhook(payload, storedNotifToken);

  if (!isValid) {
    return NextResponse.json({ error: "Webhook invalide" }, { status: 401 });
  }

  const newStatus = "COMPLETED";
  const now = new Date();

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status:         newStatus,
        transactionRef: payload.txnid,
        webhookPayload: payload as never,
        paidAt:         now,
        // Écraser transactionRef (était notif_token) avec le vrai ID de transaction
        providerPaymentId: payload.txnid,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED", confirmedAt: now },
    }),
  ]);

  return NextResponse.json({ received: true });
}
