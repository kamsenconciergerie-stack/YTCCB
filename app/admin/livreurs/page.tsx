import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { LivreursClient } from "./LivreursClient";

export const metadata: Metadata = { title: "Livreurs — Admin MTS" };

export default async function LivreursPage() {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const [livreurs, zones] = await Promise.all([
    prisma.livreur.findMany({
      orderBy: [{ actif: "desc" }, { nom: "asc" }],
      include: {
        deliveryZone: { select: { name: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.deliveryZone.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <LivreursClient livreurs={livreurs as never} zones={zones} />;
}
