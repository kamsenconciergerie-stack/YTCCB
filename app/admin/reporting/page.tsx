import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Reporting — Admin CCB" };
export const dynamic = "force-dynamic";

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp", WEB: "Web", MANUAL: "Manuel", PHONE: "Téléphone",
};

async function getReportingData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [orders, topItems, leadStats, channelStats] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, status: { not: "CANCELLED" } },
      select: { total: true, channel: true, createdAt: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: { totalPrice: true, quantity: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 5,
    }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.groupBy({ by: ["channel"], _count: { _all: true }, _sum: { total: true } }),
  ]);

  // Grouper par mois
  const byMonth: Record<string, { revenue: number; count: number }> = {};
  const monthKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = { revenue: 0, count: 0 };
    monthKeys.push(key);
  }
  orders.forEach((o) => {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (byMonth[key]) {
      byMonth[key].revenue += Number(o.total);
      byMonth[key].count += 1;
    }
  });

  const maxRevenue = Math.max(...Object.values(byMonth).map((m) => m.revenue), 1);

  const leadMap: Record<string, number> = {};
  leadStats.forEach((l) => { leadMap[l.status] = l._count._all; });
  const totalLeads = Object.values(leadMap).reduce((a, b) => a + b, 0);
  const wonLeads = leadMap["WON"] ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const totalOrders = orders.length;

  return { byMonth, monthKeys, maxRevenue, topItems, leadMap, conversionRate, totalLeads, channelStats, totalRevenue, totalOrders };
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default async function ReportingPage() {
  const { byMonth, monthKeys, maxRevenue, topItems, leadMap, conversionRate, totalLeads, channelStats, totalRevenue, totalOrders } = await getReportingData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>Reporting</h1>

      {/* KPIs 6 mois */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "CA 6 mois", value: formatPrice(totalRevenue) },
          { label: "Commandes 6 mois", value: totalOrders },
          { label: "Panier moyen", value: totalOrders > 0 ? formatPrice(totalRevenue / totalOrders) : "—" },
          { label: "Taux conv. leads", value: `${conversionRate}%` },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold" style={{ color: "var(--ccb-green)" }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphe CA mensuel */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">CA mensuel (6 derniers mois)</h2>
          <div className="flex items-end gap-2 h-36">
            {monthKeys.map((key) => {
              const m = byMonth[key];
              const height = maxRevenue > 0 ? Math.max(4, Math.round((m.revenue / maxRevenue) * 100)) : 4;
              const [year, month] = key.split("-");
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{m.revenue > 0 ? formatPrice(m.revenue).replace(" FCFA", "") : ""}</span>
                  <div className="w-full rounded-t" style={{ height: `${height}%`, backgroundColor: "var(--ccb-green)", minHeight: "4px" }} title={`${formatPrice(m.revenue)}`} />
                  <span className="text-xs text-gray-500">{MONTH_LABELS[parseInt(month) - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top produits */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top 5 produits (CA)</h2>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={item.productId} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                  <p className="text-xs text-gray-400">{item._sum.quantity ?? 0} vendus</p>
                </div>
                <span className="text-sm font-bold shrink-0" style={{ color: "var(--ccb-gold)" }}>
                  {formatPrice(item._sum.totalPrice ?? 0)}
                </span>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-sm text-gray-400">Aucune vente</p>}
          </div>
        </div>

        {/* Canal de commande */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Commandes par canal</h2>
          <div className="space-y-3">
            {channelStats.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-28">{CHANNEL_LABELS[c.channel] ?? c.channel}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.max(4, Math.round((c._count._all / Math.max(...channelStats.map((x) => x._count._all))) * 100))}%`, backgroundColor: "var(--ccb-green)" }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-6 text-right">{c._count._all}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline leads */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Pipeline leads ({totalLeads} total)</h2>
          {[
            { s: "NEW", l: "Nouveau" }, { s: "CONTACTED", l: "Contacté" },
            { s: "QUOTE_SENT", l: "Devis envoyé" }, { s: "WON", l: "Gagné" }, { s: "LOST", l: "Perdu" },
          ].map(({ s, l }) => (
            <div key={s} className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-600 w-28">{l}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: totalLeads > 0 ? `${Math.max(4, Math.round(((leadMap[s] ?? 0) / totalLeads) * 100))}%` : "4%", backgroundColor: s === "WON" ? "#16a34a" : s === "LOST" ? "#dc2626" : "var(--ccb-gold)" }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 w-6 text-right">{leadMap[s] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export CSV */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-800">Export des données</h2>
          <p className="text-sm text-gray-500 mt-0.5">Téléchargez les données pour votre comptabilité SYSCOHADA</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/admin/reporting/export?type=orders" className="btn-primary text-sm px-4 py-2">
            Export commandes CSV
          </a>
          <a href="/api/admin/reporting/export?type=leads" className="btn-gold text-sm px-4 py-2">
            Export leads CSV
          </a>
        </div>
      </div>
    </div>
  );
}
