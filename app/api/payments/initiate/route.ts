import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { InitiatePaymentSchema } from "@/lib/validators/payment";
import { createWaveCheckout } from "@/lib/payment/wave";
import { initiateOrangeMoneyPayment } from "@/lib/payment/orange-money";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// POST /api/payments/initiate
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }); }

  const parsed = InitiatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const { orderId, provider, returnUrl, cancelUrl } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, numeroCommande: true, total: true, status: true },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (order.status === "ANNULEE") return NextResponse.json({ error: "Commande annulée — paiement impossible" }, { status: 422 });
  if (order.status === "EXPIREE") return NextResponse.json({ error: "Commande expirée — paiement impossible" }, { status: 422 });

  const amount = Number(order.total);
  const successUrl = returnUrl ?? `${APP_URL}/commande/${orderId}/confirmation`;
  const errorUrl = cancelUrl ?? `${APP_URL}/commande/${orderId}/echec`;
  const idempotencyKey = `${provider.toLowerCase()}_${orderId}_${Date.now()}`;

  if (provider === "A_LA_LIVRAISON") {
    const payment = await prisma.payment.create({
      data: {
        orderId,
        provider: "A_LA_LIVRAISON",
        amount: order.total,
        idempotencyKey,
      },
    });
    return NextResponse.json({ data: { provider: "A_LA_LIVRAISON", paymentId: payment.id } });
  }

  try {
    if (provider === "WAVE") {
      const session = await createWaveCheckout({
        amount,
        orderId,
        orderNumber: order.numeroCommande,
        successUrl,
        errorUrl,
      });

      await prisma.payment.create({
        data: {
          orderId,
          provider: "WAVE",
          amount: order.total,
          providerPaymentId: session.id,
          paymentLink: session.wave_launch_url,
          idempotencyKey,
        },
      });

      // Stocker le lien Wave sur la commande pour affichage côté client
      await prisma.order.update({
        where: { id: orderId },
        data: { lienPaiementWave: session.wave_launch_url },
      });

      return NextResponse.json({ data: { provider: "WAVE", paymentUrl: session.wave_launch_url, sessionId: session.id } });
    }

    if (provider === "ORANGE_MONEY") {
      const notifUrl = `${APP_URL}/api/payments/webhook/orange-money`;
      const result = await initiateOrangeMoneyPayment({
        amount,
        orderId,
        orderNumber: order.numeroCommande,
        returnUrl: successUrl,
        cancelUrl: errorUrl,
        notifUrl,
      });

      await prisma.payment.create({
        data: {
          orderId,
          provider: "ORANGE_MONEY",
          amount: order.total,
          providerPaymentId: result.pay_token,
          paymentLink: result.payment_url,
          transactionRef: result.notif_token,
          idempotencyKey,
        },
      });

      return NextResponse.json({ data: { provider: "ORANGE_MONEY", paymentUrl: result.payment_url, payToken: result.pay_token } });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur paiement inconnue";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ error: "Provider non supporté" }, { status: 400 });
}
