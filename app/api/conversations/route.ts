import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { normalizeWhatsAppNumber } from "@/lib/order-number";

const UpsertConversationSchema = z.object({
  whatsappNumber: z.string().regex(/^\+?[0-9]{9,15}$/),
  step: z.string().min(1).max(100),
  context: z.record(z.unknown()).default({}),
  customerId: z.string().uuid().optional(),
  // Durée de vie en secondes (défaut 24h)
  ttlSeconds: z.number().int().min(60).max(172800).default(86400),
});

// GET /api/conversations?whatsappNumber=+221xxxxxxxx — état de conversation actif
export async function GET(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  const rawNumber = request.nextUrl.searchParams.get("whatsappNumber");
  if (!rawNumber) {
    return NextResponse.json({ error: "whatsappNumber requis" }, { status: 400 });
  }

  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);

  const state = await prisma.conversationState.findFirst({
    where: {
      whatsappNumber,
      expiresAt: { gt: new Date() },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!state) {
    return NextResponse.json({ data: null }, { status: 200 });
  }

  return NextResponse.json({ data: state });
}

// POST /api/conversations — créer ou mettre à jour l'état de conversation (upsert par numéro)
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = UpsertConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { whatsappNumber: rawNumber, step, context, customerId, ttlSeconds } = parsed.data;
  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // Upsert : mettre à jour l'état actif s'il existe, sinon créer
  const existing = await prisma.conversationState.findFirst({
    where: { whatsappNumber, expiresAt: { gt: new Date() } },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  let state;
  if (existing) {
    state = await prisma.conversationState.update({
      where: { id: existing.id },
      data: { step, context: context as Prisma.InputJsonValue, expiresAt, ...(customerId ? { customerId } : {}) },
    });
  } else {
    state = await prisma.conversationState.create({
      data: { whatsappNumber, step, context: context as Prisma.InputJsonValue, expiresAt, customerId },
    });
  }

  return NextResponse.json({ data: state }, { status: existing ? 200 : 201 });
}
