import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard — MTS Admin" };

export default async function DashboardPage() {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    cmdJour,
    cmdMois,
    caJour,
    caMois,
    cmdPending,
    cmdEnLivraison,
    totalArticles,
    stockFaible,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: startOfDay }, status: { in: ["PAYE","EN_PREPARATION","EN_LIVRAISON","LIVREE"] } }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: startOfMonth }, status: { in: ["PAYE","EN_PREPARATION","EN_LIVRAISON","LIVREE"] } }, _sum: { total: true } }),
    prisma.order.count({ where: { status: "PRE_CONFIRMEE" } }),
    prisma.order.count({ where: { status: "EN_LIVRAISON" } }),
    prisma.chaussure.count({ where: { actif: true } }),
    prisma.chaussure.count({ where: { actif: true, stockTotal: { lte: 3 } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, numeroCommande: true, status: true, total: true, canalFinalisation: true, createdAt: true,
        customer: { select: { name: true, whatsappNumber: true } },
      },
    }),
  ]);

  const STATUS_CLASSES: Record<string, string> = {
    PRE_CONFIRMEE: "badge-status-pre-confirmee",
    PAYE: "badge-status-paye",
    EN_PREPARATION: "badge-status-en-preparation",
    EN_LIVRAISON: "badge-status-en-livraison",
    LIVREE: "badge-status-livree",
    EXPIREE: "badge-status-expiree",
    ANNULEE: "badge-status-annulee",
  };

  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-tight mb-6">Dashboard</h1>

      {/* ── KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Commandes aujourd'hui",  value: cmdJour,      sub: `${cmdMois} ce mois`, color: "#1A1A1A" },
          { label: "CA aujourd'hui",          value: `${Number(caJour._sum.total ?? 0).toLocaleString("fr-FR")} F`, sub: `${Number(caMois._sum.total ?? 0).toLocaleString("fr-FR")} F ce mois`, color: "#C4956A" },
          { label: "En attente de paiement", value: cmdPending,   sub: "PRE_CONFIRMÉE",      color: "#EAB308" },
          { label: "En livraison",            value: cmdEnLivraison, sub: "actuellement",    color: "#25D366" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded p-5 border border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{kpi.label}</p>
            <p className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Alertes ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {stockFaible > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4 text-sm">
            ⚠️ <strong>{stockFaible} article{stockFaible > 1 ? "s" : ""}</strong> avec stock ≤ 3 paires.{" "}
            <a href="/admin/catalogue?low_stock=true" className="underline font-semibold text-orange-700">Voir</a>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
          👟 <strong>{totalArticles} article{totalArticles > 1 ? "s" : ""}</strong> actifs dans le catalogue.{" "}
          <a href="/admin/catalogue" className="underline font-semibold text-blue-700">Gérer</a>
        </div>
      </div>

      {/* ── Commandes récentes ────────────────────────────── */}
      <div className="bg-white rounded border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold uppercase tracking-wider text-sm">Commandes récentes</h2>
          <a href="/admin/commandes" className="text-xs font-semibold text-[#C4956A] hover:underline">Voir tout →</a>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Numéro", "Client", "Total", "Canal", "Statut", "Date"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentOrders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-xs">
                  <a href={`/admin/commandes/${o.id}`} className="hover:text-[#C4956A]">{o.numeroCommande}</a>
                </td>
                <td className="px-4 py-3 text-gray-600">{o.customer?.name ?? o.customer?.whatsappNumber}</td>
                <td className="px-4 py-3 font-semibold">{Number(o.total).toLocaleString("fr-FR")} F</td>
                <td className="px-4 py-3">{o.canalFinalisation === "WHATSAPP" ? "💬 WA" : "🌐 Web"}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_CLASSES[o.status] ?? ""}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
