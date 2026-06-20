import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";
import { CreateLeadSchema } from "@/lib/validators/lead";
import { normalizeWhatsAppNumber } from "@/lib/order-number";

// POST /api/leads — création lead (depuis bot WhatsApp ou saisie manuelle)
export async function POST(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = CreateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { customerId, whatsappNumber, ...rest } = parsed.data;

  // Résoudre le client si un numéro est fourni sans customerId
  let resolvedCustomerId = customerId;
  let normalizedNumber: string | undefined;

  if (whatsappNumber && !customerId) {
    normalizedNumber = normalizeWhatsAppNumber(whatsappNumber);
    const customer = await prisma.customer.findUnique({
      where: { whatsappNumber: normalizedNumber },
      select: { id: true },
    });
    if (customer) resolvedCustomerId = customer.id;
  }

  const lead = await prisma.lead.create({
    data: {
      customerId: resolvedCustomerId,
      whatsappNumber: normalizedNumber ?? whatsappNumber,
      ...rest,
    },
    include: {
      customer: { select: { name: true, whatsappNumber: true } },
      assignments: {
        where: { isCurrent: true },
        include: { salesRep: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}

// GET /api/leads — liste pour le pipeline admin
export async function GET(request: NextRequest) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const salesRepId = searchParams.get("salesRepId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(salesRepId
      ? { assignments: { some: { salesRepId, isCurrent: true } } }
      : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, whatsappNumber: true } },
        assignments: {
          where: { isCurrent: true },
          include: { salesRep: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({
    data: leads,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
