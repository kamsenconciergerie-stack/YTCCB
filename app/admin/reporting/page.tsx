import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Reporting — Admin MTS" };
export const dynamic = "force-dynamic";

async function getData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [orders, topChaussures, canalStats] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: { notIn: ["ANNULEE", "EXPIREE"] } },
      select: { total: true, canalFinalisation: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["chaussureId"],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["canalFinalisation"],
      _count: { id: true },
      _sum: { total: true },
    }),
  ]);

  const chaussureIds = topChaussures.map((t) => t.chaussureId);
  const chaussures = await prisma.chaussure.findMany({
    where: { id: { in: chaussureIds } },
    select: { id: true, nom: true, reference: true },
  });
  const chaussureMap = new Map(chaussures.map((c) => [c.id, c]));

  return { orders, topChaussures, chaussureMap, canalStats };
}

export default async function ReportingPage() {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const { orders, topChaussures, chaussureMap, canalStats } = await getData();

  const totalCA = orders.reduce((s, o) => s + Number(o.total), 0);
  const nbCommandes = orders.length;
  const panier = nbCommandes > 0 ? totalCA / nbCommandes : 0;

  // CA par mois
  const caParMois: Record<string, number> = {};
  orders.forEach((o) => {
    const key = `${new Date(o.createdAt).getFullYear()}-${String(new Date(o.createdAt).getMonth() + 1).padStart(2, "0")}`;
    caParMois[key] = (caParMois[key] ?? 0) + Number(o.total);
  });
  const moisKeys = Object.keys(caParMois).sort();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black uppercase">Reporting</h1>
        <a href="/api/admin/reporting/export?type=orders" className="btn-outline text-xs px-4 py-2">
          📥 Export CSV commandes
        </a>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "CA 6 mois", value: `${totalCA.toLocaleString("fr-FR")} FCFA`, color: "#C4956A" },
          { label: "Commandes", value: nbCommandes.toString(), color: "#1A1A1A" },
          { label: "Panier moyen", value: `${Math.round(panier).toLocaleString("fr-FR")} FCFA`, color: "#25D366" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-100 rounded p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{kpi.label}</p>
            <p className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* CA par mois */}
        <div className="bg-white border border-gray-100 rounded p-5">
          <h2 className="font-bold uppercase tracking-wider text-xs text-gray-500 mb-4">CA par mois</h2>
          <div className="space-y-2">
            {moisKeys.slice(-6).map((m) => {
              const val = caParMois[m] ?? 0;
              const pct = totalCA > 0 ? (val / totalCA) * 100 : 0;
              return (
                <div key={m}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{m}</span>
                    <span className="font-semibold">{val.toLocaleString("fr-FR")} F</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded">
                    <div className="h-2 bg-[#C4956A] rounded" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top chaussures */}
        <div className="bg-white border border-gray-100 rounded p-5">
          <h2 className="font-bold uppercase tracking-wider text-xs text-gray-500 mb-4">Top articles vendus</h2>
          <div className="space-y-2">
            {topChaussures.map((t) => {
              const ch = chaussureMap.get(t.chaussureId);
              return (
                <div key={t.chaussureId} className="flex justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]">{ch?.nom ?? "—"}</span>
                  <span className="text-gray-500 shrink-0 ml-2">
                    {t._sum.quantity ?? 0} paires — {Number(t._sum.totalPrice ?? 0).toLocaleString("fr-FR")} F
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Canaux */}
        <div className="bg-white border border-gray-100 rounded p-5">
          <h2 className="font-bold uppercase tracking-wider text-xs text-gray-500 mb-4">Canaux de commande</h2>
          {canalStats.map((c) => (
            <div key={c.canalFinalisation} className="flex justify-between text-sm py-1">
              <span>{c.canalFinalisation === "WHATSAPP" ? "💬 WhatsApp" : "🌐 Web"}</span>
              <span className="font-semibold">{c._count.id} cmd — {Number(c._sum.total ?? 0).toLocaleString("fr-FR")} F</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
