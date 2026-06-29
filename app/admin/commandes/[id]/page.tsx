import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { redirect } from "next/navigation";
import { StatusChanger } from "./StatusChanger";

export const dynamic = "force-dynamic";

const STATUS_CSS: Record<string, string> = {
  PRE_CONFIRMEE: "badge-status-pre-confirmee",
  PAYE:          "badge-status-paye",
  EN_PREPARATION:"badge-status-en-preparation",
  EN_LIVRAISON:  "badge-status-en-livraison",
  LIVREE:        "badge-status-livree",
  EXPIREE:       "badge-status-expiree",
  ANNULEE:       "badge-status-annulee",
};

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMEE: "Pré-confirmée", PAYE: "Payée",
  EN_PREPARATION: "En préparation", EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée", EXPIREE: "Expirée", ANNULEE: "Annulée",
};

export default async function CommandeDetailPage({ params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) redirect("/admin/login");

  const [commande, livreurs] = await Promise.all([
    prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        deliveryZone: true,
        livreur: true,
        items: { include: { chaussure: { select: { images: true } } } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.livreur.findMany({ where: { actif: true }, select: { id: true, nom: true, disponible: true } }),
  ]);

  if (!commande) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/commandes" className="text-sm text-gray-400 hover:text-[#C4956A]">← Commandes</Link>
        <h1 className="text-xl font-black uppercase">{commande.numeroCommande}</h1>
        <span className={STATUS_CSS[commande.status] ?? ""}>{STATUS_LABELS[commande.status]}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Client */}
        <div className="bg-white border border-gray-100 rounded p-5">
          <h2 className="font-bold uppercase tracking-wider text-xs text-gray-500 mb-3">Client</h2>
          <p className="font-semibold">{commande.customer?.name ?? "—"}</p>
          <p className="text-sm text-gray-500">{commande.customer?.whatsappNumber}</p>
          {commande.deliveryAddress && (
            <p className="text-sm text-gray-500 mt-2">📍 {commande.deliveryAddress}, {commande.deliveryCity}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Zone : {commande.deliveryZone?.name ?? "—"}</p>
        </div>

        {/* Paiement */}
        <div className="bg-white border border-gray-100 rounded p-5">
          <h2 className="font-bold uppercase tracking-wider text-xs text-gray-500 mb-3">Paiement</h2>
          <p className="text-sm">Canal : <strong>{commande.canalFinalisation === "WHATSAPP" ? "💬 WhatsApp" : "🌐 Web"}</strong></p>
          <p className="text-sm">Statut paiement : <strong>{commande.statutPaiement}</strong></p>
          {commande.paidAt && <p className="text-xs text-gray-400">Payé le {new Date(commande.paidAt).toLocaleString("fr-FR")}</p>}
          <p className="text-sm mt-2">Livreur : <strong>{commande.livreur?.nom ?? "Non assigné"}</strong></p>
          {commande.expiresAt && commande.status === "PRE_CONFIRMEE" && (
            <p className="text-xs text-orange-600 mt-1">⏰ Expire le {new Date(commande.expiresAt).toLocaleString("fr-FR")}</p>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="bg-white border border-gray-100 rounded p-5 mb-6">
        <h2 className="font-bold uppercase tracking-wider text-xs text-gray-500 mb-4">Articles</h2>
        <div className="divide-y divide-gray-50">
          {commande.items.map((it) => {
            const img = (it.chaussure?.images as string[])?.[0];
            return (
              <div key={it.id} className="flex items-center gap-3 py-3">
                <div className="w-12 h-12 bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  {img
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={img} alt={it.chaussureNom} className="w-full h-full object-cover" />
                    : <span className="text-2xl">👟</span>
                  }
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{it.chaussureNom}</p>
                  <p className="text-xs text-gray-400">{it.chaussureRef}{it.pointure ? ` — Pointure ${it.pointure}` : ""}{it.couleur ? ` — ${it.couleur}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">×{it.quantity}</p>
                  <p className="font-semibold text-sm">{Number(it.totalPrice).toLocaleString("fr-FR")} F</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span>{Number(commande.subtotal).toLocaleString("fr-FR")} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Livraison</span>
            <span>{Number(commande.deliveryFee).toLocaleString("fr-FR")} FCFA</span>
          </div>
          <div className="flex justify-between font-black text-base">
            <span>Total</span>
            <span className="text-[#C4956A]">{Number(commande.total).toLocaleString("fr-FR")} FCFA</span>
          </div>
        </div>

        <StatusChanger orderId={commande.id} currentStatus={commande.status} livreurs={livreurs} />
      </div>

      {commande.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm">
          <strong>Notes :</strong> {commande.notes}
        </div>
      )}
    </div>
  );
}
