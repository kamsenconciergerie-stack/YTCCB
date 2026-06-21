import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

const UpdateConversationSchema = z.object({
  step: z.string().min(1).max(100).optional(),
  context: z.record(z.unknown()).optional(),
  ttlSeconds: z.number().int().min(60).max(172800).optional(),
});

// PATCH /api/conversations/:id — mettre à jour l'étape et/ou le contexte
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

  const parsed = UpdateConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const existing = await prisma.conversationState.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "État de conversation introuvable" }, { status: 404 });
  }

  const { step, context, ttlSeconds } = parsed.data;
  const state = await prisma.conversationState.update({
    where: { id: params.id },
    data: {
      ...(step ? { step } : {}),
      ...(context ? { context: context as Prisma.InputJsonValue } : {}),
      ...(ttlSeconds ? { expiresAt: new Date(Date.now() + ttlSeconds * 1000) } : {}),
    },
  });

  return NextResponse.json({ data: state });
}

// DELETE /api/conversations/:id — expirer immédiatement un état (fin de session)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  const existing = await prisma.conversationState.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "État de conversation introuvable" }, { status: 404 });
  }

  await prisma.conversationState.update({
    where: { id: params.id },
    data: { expiresAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
