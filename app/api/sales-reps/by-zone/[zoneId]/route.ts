import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

// GET /api/sales-reps/by-zone/:zoneId — liste les commerciaux actifs d'une zone de livraison
export async function GET(
  request: NextRequest,
  { params }: { params: { zoneId: string } }
) {
  const authError = verifyApiKey(request);
  if (authError) return authError;

  const { zoneId } = params;

  const zone = await prisma.deliveryZone.findUnique({
    where: { id: zoneId },
    select: { id: true },
  });

  if (!zone) {
    return NextResponse.json({ error: "Zone de livraison introuvable" }, { status: 404 });
  }

  const salesReps = await prisma.salesRep.findMany({
    where: { deliveryZoneId: zoneId, isActive: true },
    select: { id: true, name: true, whatsappNumber: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: salesReps });
}
