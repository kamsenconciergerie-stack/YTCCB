import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/admin-guard";
import { z } from "zod";

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
  });

  return NextResponse.json({ data: updated });
}
