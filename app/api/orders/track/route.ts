import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/orders/track?num=MTS-20260629-0001
export async function GET(request: NextRequest) {
  const num = request.nextUrl.searchParams.get("num")?.trim().toUpperCase();
  if (!num) return NextResponse.json({ error: "Numéro de commande requis" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { numeroCommande: num },
    select: {
      numeroCommande: true,
      status: true,
      statutPaiement: true,
      canalFinalisation: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      deliveryAddress: true,
      deliveryCity: true,
      paidAt: true,
      deliveredAt: true,
      createdAt: true,
      expiresAt: true,
      deliveryZone: { select: { name: true } },
      livreur: { select: { nom: true, telephone: true } },
      items: {
        select: {
          chaussureNom: true,
          chaussureRef: true,
          quantity: true,
          pointure: true,
          couleur: true,
          unitPrice: true,
          totalPrice: true,
        },
      },
      payments: {
        select: { provider: true, paidAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  return NextResponse.json({ data: order });
}
