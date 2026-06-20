import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/admin-guard";
import { generateOrderNumber, normalizeWhatsAppNumber } from "@/lib/order-number";
import { z } from "zod";
import crypto from "crypto";

const ManualOrderSchema = z.object({
  customerWhatsapp: z.string().min(8),
  customerName: z.string().optional(),
  channel: z.enum(["MANUAL", "PHONE"]).default("MANUAL"),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1) })).min(1),
  deliveryZoneId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "ON_DELIVERY"]).default("ON_DELIVERY"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = ManualOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });

  const { customerWhatsapp, customerName, channel, items, deliveryZoneId, deliveryAddress, deliveryCity, paymentMethod, notes } = parsed.data;
  const normalizedNumber = normalizeWhatsAppNumber(customerWhatsapp);

  const customer = await prisma.customer.upsert({
    where: { whatsappNumber: normalizedNumber },
    create: { whatsappNumber: normalizedNumber, name: customerName },
    update: customerName ? { name: customerName } : {},
  });

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
    select: { id: true, name: true, price: true, sku: true, unit: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderItemsData = items.map((item) => {
    const p = productMap.get(item.productId)!;
    const unitPrice = Number(p.price);
    return { productId: item.productId, quantity: item.quantity, unitPrice, totalPrice: unitPrice * item.quantity, productName: p.name, productSku: p.sku, unit: p.unit };
  });

  const subtotal = orderItemsData.reduce((s, i) => s + i.totalPrice, 0);
  let deliveryFee = 0;
  if (deliveryZoneId) {
    const zone = await prisma.deliveryZone.findUnique({ where: { id: deliveryZoneId }, select: { baseFee: true } });
    deliveryFee = zone ? Number(zone.baseFee) : 0;
  }

  const orderNumber = await generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      orderNumber, customerId: customer.id, channel, deliveryZoneId: deliveryZoneId ?? null,
      subtotal, deliveryFee, total: subtotal + deliveryFee,
      deliveryAddress: deliveryAddress ?? null, deliveryCity: deliveryCity ?? null, notes: notes ?? null,
      items: { create: orderItemsData },
      payments: { create: { provider: paymentMethod, status: "PENDING", amount: subtotal + deliveryFee, idempotencyKey: crypto.randomUUID() } },
    },
    select: { orderNumber: true, id: true },
  });

  await prisma.customer.update({ where: { id: customer.id }, data: { totalOrders: { increment: 1 }, totalSpent: { increment: subtotal + deliveryFee } } });

  return NextResponse.json({ data: order }, { status: 201 });
}
