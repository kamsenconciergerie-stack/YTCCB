import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Commandes — Admin CCB" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMED:  "Pré-confirmée",
  CONFIRMED:      "Confirmée",
  IN_PREPARATION: "En préparation",
  IN_DELIVERY:    "En livraison",
  DELIVERED:      "Livrée",
  CANCELLED:      "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  PRE_CONFIRMED:  "bg-yellow-100 text-yellow-800",
  CONFIRMED:      "bg-blue-100 text-blue-800",
  IN_PREPARATION: "bg-purple-100 text-purple-800",
  IN_DELIVERY:    "bg-orange-100 text-orange-800",
  DELIVERED:      "bg-green-100 text-green-800",
  CANCELLED:      "bg-red-100 text-red-800",
};

const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp", WEB: "Web", MANUAL: "Manuel", PHONE: "Téléphone",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

export default async function CommandesPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = ALL_STATUSES.includes(searchParams.status ?? "") ? searchParams.status : undefined;

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { name: true, whatsappNumber: true } },
      _count: { select: { items: true } },
    },
  });

  const counts = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count._all; });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--ccb-green)" }}>
          Commandes
        </h1>
        <a href="/admin/commandes/nouvelle" className="btn-gold text-sm px-4 py-2">
          + Nouvelle commande
        </a>
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-2">
        <a href="/admin/commandes"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!status ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          style={!status ? { backgroundColor: "var(--ccb-green)" } : {}}
        >
          Toutes ({orders.length > 0 && !status ? orders.length : Object.values(countMap).reduce((a, b) => a + b, 0)})
        </a>
        {ALL_STATUSES.map((s) => (
          <a key={s} href={`/admin/commandes?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${status === s ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            style={status === s ? { backgroundColor: "var(--ccb-gold)" } : {}}
          >
            {STATUS_LABELS[s]} ({countMap[s] ?? 0})
          </a>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">N° commande</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">Canal</th>
                <th className="px-5 py-3 text-left">Statut</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900 text-xs">
                    {order.orderNumber}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    <div>{order.customer.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{order.customer.whatsappNumber}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{CHANNEL_LABELS[order.channel] ?? order.channel}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-5 py-3">
                    <a href={`/admin/commandes/${order.id}`} className="text-xs font-medium hover:underline" style={{ color: "var(--ccb-gold)" }}>
                      Détails →
                    </a>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Aucune commande</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
