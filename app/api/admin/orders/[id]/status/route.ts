import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/admin-guard";
import { z } from "zod";

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED:      "✅ Votre commande {orderNumber} est *confirmée* ! Nous la préparons dès que possible.",
  IN_PREPARATION: "📦 Votre commande {orderNumber} est *en cours de préparation*.",
  IN_DELIVERY:    "🚚 Votre commande {orderNumber} est *en route* ! Notre livreur vous contactera bientôt.",
  DELIVERED:      "🎉 Votre commande {orderNumber} a été *livrée* avec succès. Merci pour votre confiance !",
  CANCELLED:      "❌ Votre commande {orderNumber} a été *annulée*. Contactez-nous au besoin.",
};

async function notifyClient(whatsappNumber: string, orderNumber: string, newStatus: string) {
  const template = STATUS_MESSAGES[newStatus];
  if (!template) return;

  const message = template.replace("{orderNumber}", orderNumber);
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1220775091119442";
  if (!token) return;

  const to = whatsappNumber.replace(/^\+/, "");
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
  }).catch(() => null);
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PRE_CONFIRMED:  ["CONFIRMED", "CANCELLED"],
  CONFIRMED:      ["IN_PREPARATION", "CANCELLED"],
  IN_PREPARATION: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY:    ["DELIVERED", "CANCELLED"],
  DELIVERED:      [],
  CANCELLED:      [],
};

const Schema = z.object({
  status: z.enum(["PRE_CONFIRMED", "CONFIRMED", "IN_PREPARATION", "IN_DELIVERY", "DELIVERED", "CANCELLED"]),
  cancelReason: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 422 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json({ error: `Transition interdite`, allowedTransitions: allowed }, { status: 422 });
  }

  const now = new Date();
  const timestamps: Record<string, Date> = {};
  if (parsed.data.status === "CONFIRMED") timestamps.confirmedAt = now;
  if (parsed.data.status === "DELIVERED") timestamps.deliveredAt = now;

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.cancelReason ? { cancelReason: parsed.data.cancelReason } : {}),
      ...timestamps,
    },
    include: { customer: { select: { whatsappNumber: true } } },
  });

  void notifyClient(updated.customer.whatsappNumber, updated.orderNumber, parsed.data.status);

  return NextResponse.json({ data: updated });
}
