import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard — CCB Admin" };

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersToday, revenueToday, ordersActive, pendingLeads] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: { notIn: ["CANCELLED"] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: { in: ["PRE_CONFIRMED", "CONFIRMED", "IN_PREPARATION", "IN_DELIVERY"] } },
    }),
    prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED"] } } }),
  ]);

  return {
    ordersToday,
    revenueToday: Number(revenueToday._sum.total ?? 0),
    ordersActive,
    pendingLeads,
  };
}

async function getRecentOrders() {
  return prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true, whatsappNumber: true } },
      _count: { select: { items: true } },
    },
  });
}

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMED:  "Pré-confirmée",
  CONFIRMED:      "Confirmée",
  IN_PREPARATION: "En préparation",
  IN_DELIVERY:    "En livraison",
  DELIVERED:      "Livrée",
  CANCELLED:      "Annulée",
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  WEB:      "Web",
  MANUAL:   "Manuel",
  PHONE:    "Téléphone",
};

export default async function AdminDashboardPage() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>
        Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Commandes aujourd'hui", value: stats.ordersToday, icon: "📦" },
          {
            label: "CA aujourd'hui",
            value: `${stats.revenueToday.toLocaleString("fr-SN")} FCFA`,
            icon: "💰",
          },
          { label: "Commandes actives", value: stats.ordersActive, icon: "🚀" },
          { label: "Leads en attente", value: stats.pendingLeads, icon: "🎯" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{kpi.label}</span>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--ccb-green)" }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Commandes récentes */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Commandes récentes</h2>
          <a href="/admin/commandes" className="text-sm font-medium" style={{ color: "var(--ccb-gold)" }}>
            Voir tout →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">N° commande</th>
                <th className="px-6 py-3 text-left">Client</th>
                <th className="px-6 py-3 text-left">Canal</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.customer.name ?? order.customer.whatsappNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {CHANNEL_LABELS[order.channel] ?? order.channel}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {Number(order.total).toLocaleString("fr-SN")} F
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Aucune commande pour l'instant
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
