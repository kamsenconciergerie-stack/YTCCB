import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { OrderFiltersSchema } from "@/lib/validators/order";

// GET /api/admin/orders — liste paginée des commandes (admin)
export async function GET(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = OrderFiltersSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Filtres invalides" }, { status: 422 });

  const { status, canal, customerId, dateFrom, dateTo, page, limit } = parsed.data;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (canal) where.canalFinalisation = canal;
  if (customerId) where.customerId = customerId;
  if (dateFrom || dateTo) where.createdAt = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { name: true, whatsappNumber: true } },
        livreur: { select: { nom: true, telephone: true } },
        items: {
          select: { chaussureNom: true, quantity: true, pointure: true, couleur: true, unitPrice: true },
        },
      },
    }),
  ]);

  return NextResponse.json({
    data: orders,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
