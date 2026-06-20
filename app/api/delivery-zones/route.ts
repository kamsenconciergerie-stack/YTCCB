import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    select: { id: true, name: true, baseFee: true, description: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: zones });
}
