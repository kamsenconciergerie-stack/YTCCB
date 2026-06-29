import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Commandes — Admin MTS" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMEE:  "Pré-confirmée",
  PAYE:           "Payée",
  EN_PREPARATION: "En préparation",
  EN_LIVRAISON:   "En livraison",
  LIVREE:         "Livrée",
  EXPIREE:        "Expirée",
  ANNULEE:        "Annulée",
};

const STATUS_CSS: Record<string, string> = {
  PRE_CONFIRMEE:  "badge-status-pre-confirmee",
  PAYE:           "badge-status-paye",
  EN_PREPARATION: "badge-status-en-preparation",
  EN_LIVRAISON:   "badge-status-en-livraison",
  LIVREE:         "badge-status-livree",
  EXPIREE:        "badge-status-expiree",
  ANNULEE:        "badge-status-annulee",
};

type Props = { searchParams?: { status?: string; canal?: string; page?: string } };

export default async function CommandesPage({ searchParams }: Props) {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const status = searchParams?.status ?? "";
  const canal = searchParams?.canal ?? "";
  const page = parseInt(searchParams?.page ?? "1", 10);
  const limit = 25;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (canal) where.canalFinalisation = canal;

  const [total, commandes] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: { select: { name: true, whatsappNumber: true } },
        livreur: { select: { nom: true } },
        items: { select: { chaussureNom: true, quantity: true, pointure: true }, take: 3 },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase">Commandes</h1>
          <p className="text-sm text-gray-500">{total} commande{total > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ label: "Toutes", val: "" }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ label: l, val: v }))].map(({ label, val }) => (
          <Link
            key={val}
            href={`/admin/commandes?${val ? `status=${val}` : ""}${canal ? `&canal=${canal}` : ""}`}
            className={`text-xs px-3 py-1.5 border transition-colors font-semibold ${status === val ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-gray-200 hover:border-[#1A1A1A]"}`}
          >
            {label}
          </Link>
        ))}
        <span className="w-px bg-gray-200 mx-1" />
        {[{ label: "🌐 Web", val: "WEB" }, { label: "💬 WA", val: "WHATSAPP" }].map(({ label, val }) => (
          <Link
            key={val}
            href={`/admin/commandes?${status ? `status=${status}&` : ""}canal=${val}`}
            className={`text-xs px-3 py-1.5 border transition-colors font-semibold ${canal === val ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-gray-200 hover:border-[#1A1A1A]"}`}
          >
            {label}
          </Link>
        ))}
        {(status || canal) && (
          <Link href="/admin/commandes" className="text-xs px-3 py-1.5 text-gray-400 hover:text-[#1A1A1A]">✕ Reset</Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Numéro", "Client", "Articles", "Total", "Canal", "Statut", "Livreur", "Date", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {commandes.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">Aucune commande.</td></tr>
            ) : commandes.map((cmd) => (
              <tr key={cmd.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{cmd.numeroCommande}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{cmd.customer?.name ?? "—"}</div>
                  <div className="text-xs text-gray-400">{cmd.customer?.whatsappNumber}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-[150px]">
                  {cmd.items.map((it) => (
                    <div key={it.chaussureNom} className="truncate">{it.chaussureNom} ×{it.quantity}{it.pointure ? ` P${it.pointure}` : ""}</div>
                  ))}
                </td>
                <td className="px-4 py-3 font-semibold">{Number(cmd.total).toLocaleString("fr-FR")} F</td>
                <td className="px-4 py-3 text-xs">{cmd.canalFinalisation === "WHATSAPP" ? "💬 WA" : "🌐 Web"}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_CSS[cmd.status] ?? ""}>{STATUS_LABELS[cmd.status] ?? cmd.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{cmd.livreur?.nom ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(cmd.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/commandes/${cmd.id}`} className="text-xs text-[#C4956A] font-semibold hover:underline">Détails</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/commandes?${status ? `status=${status}&` : ""}${canal ? `canal=${canal}&` : ""}page=${p}`}
              className={`w-9 h-9 flex items-center justify-center text-xs font-bold border transition-colors ${p === page ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "border-gray-200 hover:border-[#1A1A1A]"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
