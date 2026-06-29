import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrangeMoneyWebhook, OrangeMoneyWebhookPayload } from "@/lib/payment/orange-money";

// POST /api/payments/webhook/orange-money
export async function POST(request: NextRequest) {
  let payload: OrangeMoneyWebhookPayload;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const payment = await prisma.payment.findFirst({
    where: { providerPaymentId: payload.pay_token },
    select: { id: true, orderId: true, transactionRef: true, paidAt: true, idempotencyKey: true },
  });

  if (!payment) return NextResponse.json({ received: true });
  if (payment.paidAt) return NextResponse.json({ received: true, skipped: true });

  const isValid = verifyOrangeMoneyWebhook(payload, payment.transactionRef ?? "");
  if (!isValid) return NextResponse.json({ error: "Webhook invalide" }, { status: 401 });

  const now = new Date();

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { transactionRef: payload.txnid, providerPaymentId: payload.txnid, webhookPayload: payload as never, paidAt: now },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAYE", statutPaiement: "PAYE", paidAt: now },
    }),
  ]);

  return NextResponse.json({ received: true });
}
