import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get("orderNumber")?.trim().toUpperCase();

  if (!orderNumber) {
    return NextResponse.json({ error: "Numéro de commande requis" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true,
      status: true,
      channel: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      deliveryAddress: true,
      deliveryCity: true,
      confirmedAt: true,
      deliveredAt: true,
      createdAt: true,
      deliveryZone: { select: { name: true } },
      items: {
        select: {
          productName: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          unit: true,
        },
      },
      payments: {
        select: { provider: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data: order });
}
