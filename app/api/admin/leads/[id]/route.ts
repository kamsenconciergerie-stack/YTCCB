import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/admin-guard";
import { z } from "zod";

const Schema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUOTE_SENT", "WON", "LOST"]),
  lostReason: z.string().optional(),
  notes: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSession();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 422 });

  const now = new Date();
  const timestamps: Record<string, Date | null> = {};
  if (parsed.data.status === "WON") timestamps.wonAt = now;
  if (parsed.data.status === "LOST") timestamps.lostAt = now;

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: { ...parsed.data, ...timestamps },
  });

  return NextResponse.json({ data: lead });
}
