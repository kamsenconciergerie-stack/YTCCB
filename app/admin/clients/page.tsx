import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Clients — Admin MTS" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.customer.findMany({
    orderBy: { totalOrders: "desc" },
    take: 100,
    select: {
      id: true, name: true, whatsappNumber: true, email: true,
      totalOrders: true, totalSpent: true, isBlocked: true, createdAt: true,
      city: true,
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold" style={{ color: "var(--mts-primary)" }}>
          Clients <span className="text-lg text-gray-400 font-sans font-normal">({clients.length})</span>
        </h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-left">WhatsApp</th>
                <th className="px-5 py-3 text-left">Ville</th>
                <th className="px-5 py-3 text-right">Commandes</th>
                <th className="px-5 py-3 text-right">Total dépensé</th>
                <th className="px-5 py-3 text-left">Depuis</th>
                <th className="px-5 py-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{c.name ?? "—"}</p>
                    {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{c.whatsappNumber}</td>
                  <td className="px-5 py-3 text-gray-500">{c.city ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-semibold">{c.totalOrders}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatPrice(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-3 text-center">
                    {c.isBlocked
                      ? <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Bloqué</span>
                      : <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Actif</span>}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Aucun client</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
