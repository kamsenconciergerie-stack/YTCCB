import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { UpdateOrderStatusSchema } from "@/lib/validators/order";

// Transitions de statut autorisées (machine à états)
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PRE_CONFIRMED:  ["CONFIRMED", "CANCELLED"],
  CONFIRMED:      ["IN_PREPARATION", "CANCELLED"],
  IN_PREPARATION: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY:    ["DELIVERED", "CANCELLED"],
  DELIVERED:      [],
  CANCELLED:      [],
};

// PATCH /api/orders/:id/status — changement de statut commande
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = UpdateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(parsed.data.status)) {
    return NextResponse.json(
      {
        error: `Transition interdite : ${order.status} → ${parsed.data.status}`,
        allowedTransitions: allowed,
      },
      { status: 422 }
    );
  }

  const now = new Date();
  const timestamps: Partial<{ confirmedAt: Date; deliveredAt: Date }> = {};
  if (parsed.data.status === "CONFIRMED") timestamps.confirmedAt = now;
  if (parsed.data.status === "DELIVERED") timestamps.deliveredAt = now;

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.cancelReason ? { cancelReason: parsed.data.cancelReason } : {}),
      ...timestamps,
    },
    include: {
      customer: { select: { name: true, whatsappNumber: true } },
    },
  });

  return NextResponse.json({ data: updated });
}
