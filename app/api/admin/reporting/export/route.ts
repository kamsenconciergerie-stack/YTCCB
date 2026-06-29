import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const type = request.nextUrl.searchParams.get("type") ?? "orders";

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true, whatsappNumber: true } },
        livreur: { select: { nom: true } },
        items: { select: { chaussureNom: true, chaussureRef: true, quantity: true, unitPrice: true, totalPrice: true, pointure: true, couleur: true } },
      },
    });

    const rows = [
      ["N° Commande", "Date", "Client", "WhatsApp", "Canal", "Statut", "Paiement", "Sous-total", "Livraison", "Total", "Livreur", "Articles"].join(";"),
      ...orders.map((o) => [
        o.numeroCommande,
        o.createdAt.toISOString().split("T")[0],
        o.customer?.name ?? "",
        o.customer?.whatsappNumber ?? "",
        o.canalFinalisation,
        o.status,
        o.statutPaiement,
        Number(o.subtotal).toFixed(0),
        Number(o.deliveryFee).toFixed(0),
        Number(o.total).toFixed(0),
        o.livreur?.nom ?? "",
        o.items.map((i) => `${i.chaussureNom} ×${i.quantity}${i.pointure ? ` P${i.pointure}` : ""}`).join(" | "),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
    ].join("\n");

    return new NextResponse("﻿" + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mts-commandes-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  // Export catalogue chaussures
  const chaussures = await prisma.chaussure.findMany({ orderBy: { createdAt: "desc" } });

  const rows = [
    ["Référence", "Nom", "Marque", "Catégorie", "Couleur", "Prix", "Prix Promo", "Stock", "Actif", "Source"].join(";"),
    ...chaussures.map((c) => [
      c.reference, c.nom, c.marque ?? "", c.categorie, c.couleur ?? "",
      Number(c.prix).toFixed(0), c.prixPromo ? Number(c.prixPromo).toFixed(0) : "",
      c.stockTotal, c.actif ? "oui" : "non", c.sourceImport,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  return new NextResponse("﻿" + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mts-catalogue-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
