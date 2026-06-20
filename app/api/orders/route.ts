import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { generateOrderNumber, normalizeWhatsAppNumber } from "@/lib/order-number";
import { CreateOrderSchema, OrderFiltersSchema } from "@/lib/validators/order";

// GET /api/orders — liste avec filtres (protégé API key — appelé par le dashboard via clé ou session admin)
export async function GET(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;

  const parsed = OrderFiltersSchema.safeParse({
    status:     searchParams.get("status")     ?? undefined,
    channel:    searchParams.get("channel")    ?? undefined,
    customerId: searchParams.get("customerId") ?? undefined,
    dateFrom:   searchParams.get("dateFrom")   ?? undefined,
    dateTo:     searchParams.get("dateTo")     ?? undefined,
    page:       searchParams.get("page")       ?? "1",
    limit:      searchParams.get("limit")      ?? "20",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, channel, customerId, dateFrom, dateTo, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where = {
    ...(status     ? { status }     : {}),
    ...(channel    ? { channel }    : {}),
    ...(customerId ? { customerId } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo   ? { lte: dateTo }   : {}),
          },
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, whatsappNumber: true } },
        deliveryZone: { select: { name: true } },
        _count: { select: { items: true } },
        payments: {
          select: { status: true, provider: true, amount: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    data: orders,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/orders — création commande (WhatsApp bot, web checkout, saisie manuelle)
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const {
    customerWhatsapp,
    customerName,
    channel,
    items,
    deliveryZoneId,
    deliveryAddress,
    deliveryCity,
    notes,
  } = parsed.data;

  const normalizedNumber = normalizeWhatsAppNumber(customerWhatsapp);

  // Récupérer ou créer le client
  const customer = await prisma.customer.upsert({
    where: { whatsappNumber: normalizedNumber },
    create: {
      whatsappNumber: normalizedNumber,
      name: customerName,
    },
    update: {
      ...(customerName ? { name: customerName } : {}),
    },
  });

  // Charger les produits pour calculer les montants
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, price: true, stockQty: true, sku: true, unit: true },
  });

  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    return NextResponse.json(
      { error: "Produits introuvables ou inactifs", missing },
      { status: 422 }
    );
  }

  // Calculer les lignes et le sous-total
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

  // Frais de livraison selon la zone
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
      deliveryZoneId,
      channel,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryCity,
      notes,
      items: { create: orderItemsData },
    },
    include: {
      items: true,
      customer: { select: { name: true, whatsappNumber: true } },
    },
  });

  // Incrémenter les compteurs client
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      totalOrders: { increment: 1 },
      totalSpent: { increment: total },
    },
  });

  return NextResponse.json({ data: order }, { status: 201 });
}
