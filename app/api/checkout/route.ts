import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, normalizeWhatsAppNumber } from "@/lib/order-number";
import { z } from "zod";
import crypto from "crypto";

const CheckoutSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerWhatsapp: z.string().min(8),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  deliveryZoneId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  paymentMethod: z.enum(["WAVE", "ORANGE_MONEY", "ON_DELIVERY"]),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const {
    customerName,
    customerWhatsapp,
    items,
    deliveryZoneId,
    deliveryAddress,
    deliveryCity,
    paymentMethod,
    notes,
  } = parsed.data;

  const normalizedNumber = normalizeWhatsAppNumber(customerWhatsapp);

  const customer = await prisma.customer.upsert({
    where: { whatsappNumber: normalizedNumber },
    create: { whatsappNumber: normalizedNumber, name: customerName },
    update: customerName ? { name: customerName } : {},
  });

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, price: true, stockQty: true, sku: true, unit: true },
  });

  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    return NextResponse.json({ error: "Produits introuvables ou inactifs", missing }, { status: 422 });
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const orderItemsData = items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.price);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      productName: product.name,
      productSku: product.sku,
      unit: product.unit,
    };
  });

  const subtotal = orderItemsData.reduce((acc, i) => acc + i.totalPrice, 0);

  let deliveryFee = 0;
  if (deliveryZoneId) {
    const zone = await prisma.deliveryZone.findUnique({
      where: { id: deliveryZoneId },
      select: { baseFee: true },
    });
    deliveryFee = zone ? Number(zone.baseFee) : 0;
  }

  const total = subtotal + deliveryFee;
  const orderNumber = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      deliveryZoneId: deliveryZoneId ?? null,
      channel: "WEB",
      subtotal,
      deliveryFee,
      total,
      deliveryAddress: deliveryAddress ?? null,
      deliveryCity: deliveryCity ?? null,
      notes: notes ?? null,
      items: { create: orderItemsData },
      payments: {
        create: {
          provider: paymentMethod,
          status: "PENDING",
          amount: total,
          idempotencyKey: crypto.randomUUID(),
        },
      },
    },
    select: { orderNumber: true },
  });

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalOrders: { increment: 1 },
      totalSpent: { increment: total },
    },
  });

  return NextResponse.json(
    { data: { orderNumber: order.orderNumber, total, paymentMethod } },
    { status: 201 }
  );
}
