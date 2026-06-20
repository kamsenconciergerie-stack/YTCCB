import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  const type = request.nextUrl.searchParams.get("type") ?? "orders";

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, whatsappNumber: true } },
        items: { select: { productName: true, quantity: true, unitPrice: true, totalPrice: true, unit: true } },
      },
    });

    const rows = [
      ["N° Commande", "Date", "Client", "WhatsApp", "Canal", "Statut", "Sous-total", "Livraison", "Total", "Produits"].join(";"),
      ...orders.map((o) => [
        o.orderNumber,
        o.createdAt.toISOString().split("T")[0],
        o.customer.name ?? "",
        o.customer.whatsappNumber,
        o.channel,
        o.status,
        Number(o.subtotal).toFixed(0),
        Number(o.deliveryFee).toFixed(0),
        Number(o.total).toFixed(0),
        o.items.map((i) => `${i.productName} x${i.quantity}`).join(" | "),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    return new NextResponse("﻿" + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ccb-commandes-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // leads
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, whatsappNumber: true } },
      assignments: { where: { isCurrent: true }, include: { salesRep: { select: { name: true } } }, take: 1 },
    },
  });

  const rows = [
    ["Nom", "Entreprise", "WhatsApp", "Statut", "Commercial", "Valeur estimée", "Date"].join(";"),
    ...leads.map((l) => [
      l.name ?? l.customer?.name ?? "",
      l.company ?? "",
      l.whatsappNumber ?? l.customer?.whatsappNumber ?? "",
      l.status,
      l.assignments[0]?.salesRep.name ?? "",
      l.estimatedValue ? Number(l.estimatedValue).toFixed(0) : "",
      l.createdAt.toISOString().split("T")[0],
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  return new NextResponse("﻿" + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ccb-leads-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
