import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/admin-guard";

export async function GET() {
  const { error } = await requireSession();
  if (error) return error;

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, whatsappNumber: true } },
      assignments: {
        where: { isCurrent: true },
        include: { salesRep: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  return NextResponse.json({ data: leads });
}
