import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, orderExpiresAt, normalizeWhatsAppNumber } from "@/lib/order-number";
import { CreateOrderSchema } from "@/lib/validators/order";
import crypto from "crypto";

// POST /api/checkout — créer une commande (Web ou WhatsApp)
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }); }

  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 });
  }

  const {
    customerName, customerWhatsapp, deliveryAddress, deliveryCity,
    deliveryZoneId, canalFinalisation, items, notes,
  } = parsed.data;

  const normalizedWa = normalizeWhatsAppNumber(customerWhatsapp);

  // Upsert client
  const customer = await prisma.customer.upsert({
    where: { whatsappNumber: normalizedWa },
    create: { whatsappNumber: normalizedWa, name: customerName },
    update: customerName ? { name: customerName } : {},
  });

  if (customer.isBlocked) {
    return NextResponse.json({ error: "Compte client bloqué" }, { status: 403 });
  }

  // Vérifier les chaussures
  const chaussureIds = Array.from(new Set(items.map((i) => i.chaussureId)));
  const chaussures = await prisma.chaussure.findMany({
    where: { id: { in: chaussureIds }, actif: true },
    select: { id: true, nom: true, reference: true, prix: true, prixPromo: true, stockTotal: true },
  });

  if (chaussures.length !== chaussureIds.length) {
    const found = new Set(chaussures.map((c) => c.id));
    const missing = chaussureIds.filter((id) => !found.has(id));
    return NextResponse.json({ error: "Chaussures introuvables ou inactives", missing }, { status: 422 });
  }

  const chaussureMap = new Map(chaussures.map((c) => [c.id, c]));

  // Construire les lignes de commande
  const orderItemsData = items.map((item) => {
    const ch = chaussureMap.get(item.chaussureId)!;
    const unitPrice = Number(ch.prixPromo ?? ch.prix);
    return {
      chaussureId: item.chaussureId,
      quantity: item.quantity,
      pointure: item.pointure ?? null,
      couleur: item.couleur ?? null,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      chaussureNom: ch.nom,
      chaussureRef: ch.reference,
    };
  });

  const subtotal = orderItemsData.reduce((acc, i) => acc + i.totalPrice, 0);

  // Frais de livraison
  let deliveryFee = 0;
  const zone = await prisma.deliveryZone.findUnique({
    where: { id: deliveryZoneId },
    select: { baseFee: true, isActive: true },
  });
  if (!zone || !zone.isActive) {
    return NextResponse.json({ error: "Zone de livraison invalide" }, { status: 422 });
  }
  deliveryFee = Number(zone.baseFee);
  const total = subtotal + deliveryFee;

  const numeroCommande = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      numeroCommande,
      customerId: customer.id,
      deliveryZoneId,
      canalFinalisation,
      subtotal,
      deliveryFee,
      total,
      deliveryAddress,
      deliveryCity,
      notes: notes ?? null,
      expiresAt: orderExpiresAt(),
      items: { create: orderItemsData },
    },
    select: {
      id: true,
      numeroCommande: true,
      total: true,
      canalFinalisation: true,
      items: { select: { chaussureNom: true, quantity: true, pointure: true } },
    },
  });

  // Mettre à jour les stats client
  await prisma.customer.update({
    where: { id: customer.id },
    data: { totalOrders: { increment: 1 }, totalSpent: { increment: total } },
  });

  // Pour Wave Web : créer un record de paiement
  if (canalFinalisation === "WEB") {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "WAVE",
        amount: total,
        idempotencyKey: crypto.randomUUID(),
      },
    });
  }

  return NextResponse.json({
    data: {
      orderId: order.id,
      numeroCommande: order.numeroCommande,
      total: Number(order.total),
      canalFinalisation: order.canalFinalisation,
      // Le lien Wave est généré séparément par POST /api/payments/wave/create
    },
  }, { status: 201 });
}
