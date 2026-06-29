import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { UpdateOrderStatusSchema } from "@/lib/validators/order";

const STATUS_MESSAGES: Record<string, string> = {
  PAYE:           "✅ Votre commande *{num}* est confirmée — paiement reçu !",
  EN_PREPARATION: "📦 Votre commande *{num}* est en cours de préparation.",
  EN_LIVRAISON:   "🚚 Votre commande *{num}* est en route ! Notre livreur vous contactera bientôt.",
  LIVREE:         "🎉 Votre commande *{num}* a été livrée. Merci de votre confiance chez Mor Talla Sandaga !",
  ANNULEE:        "❌ Votre commande *{num}* a été annulée. Contactez-nous pour plus d'infos.",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PRE_CONFIRMEE:  ["PAYE", "ANNULEE"],
  PAYE:           ["EN_PREPARATION", "REMBOURSE", "ANNULEE"],
  EN_PREPARATION: ["EN_LIVRAISON", "ANNULEE"],
  EN_LIVRAISON:   ["LIVREE", "ANNULEE"],
  LIVREE:         [],
  EXPIREE:        [],
  ANNULEE:        [],
};

async function notifyClient(whatsappNumber: string, numeroCommande: string, newStatus: string) {
  const template = STATUS_MESSAGES[newStatus];
  if (!template) return;

  const message = template.replace("{num}", numeroCommande);
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;

  const to = whatsappNumber.replace(/^\+/, "");
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
  }).catch(() => null);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = UpdateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true, status: true, numeroCommande: true,
      customer: { select: { whatsappNumber: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      { error: `Transition ${order.status} → ${parsed.data.status} non autorisée`, allowedTransitions: allowed },
      { status: 422 }
    );
  }

  const now = new Date();
  const timestamps: Record<string, Date> = {};
  if (parsed.data.status === "PAYE") timestamps.paidAt = now;
  if (parsed.data.status === "LIVREE") timestamps.deliveredAt = now;

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.status === "PAYE" ? { statutPaiement: "PAYE" } : {}),
      ...(parsed.data.cancelReason ? { cancelReason: parsed.data.cancelReason } : {}),
      ...(parsed.data.livreurId ? { livreurId: parsed.data.livreurId } : {}),
      ...timestamps,
    },
  });

  void notifyClient(order.customer.whatsappNumber, order.numeroCommande, parsed.data.status);

  return NextResponse.json({ data: updated });
}
