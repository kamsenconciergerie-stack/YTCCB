import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/format";
import { StatusChanger } from "./StatusChanger";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PRE_CONFIRMED: "Pré-confirmée", CONFIRMED: "Confirmée",
  IN_PREPARATION: "En préparation", IN_DELIVERY: "En livraison",
  DELIVERED: "Livrée", CANCELLED: "Annulée",
};
const STATUS_COLORS: Record<string, string> = {
  PRE_CONFIRMED: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PREPARATION: "bg-purple-100 text-purple-800", IN_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
};
const CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp", WEB: "Web", MANUAL: "Saisie manuelle", PHONE: "Téléphone",
};
const PAYMENT_LABELS: Record<string, string> = {
  WAVE: "Wave", ORANGE_MONEY: "Orange Money", ON_DELIVERY: "À la livraison",
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      deliveryZone: { select: { name: true } },
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <a href="/admin/commandes" className="text-sm text-gray-400 hover:text-gray-600">← Commandes</a>
        <h1 className="text-xl font-display font-bold font-mono" style={{ color: "var(--ccb-green)" }}>
          {order.orderNumber}
        </h1>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <StatusChanger orderId={order.id} currentStatus={order.status} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Client */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Client</h3>
          <p className="font-semibold">{order.customer.name ?? "—"}</p>
          <p className="text-sm text-gray-500">{order.customer.whatsappNumber}</p>
          {order.customer.email && <p className="text-sm text-gray-500">{order.customer.email}</p>}
        </div>

        {/* Livraison */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Livraison</h3>
          <p className="text-sm font-medium">{order.deliveryZone?.name ?? "Non précisé"}</p>
          {order.deliveryAddress && <p className="text-sm text-gray-500">{order.deliveryAddress}</p>}
          {order.deliveryCity && <p className="text-sm text-gray-500">{order.deliveryCity}</p>}
          <p className="text-sm text-gray-400 mt-1">Canal : {CHANNEL_LABELS[order.channel]}</p>
          <p className="text-xs text-gray-400 mt-1">Créée le {formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Articles */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Articles ({order.items.length})
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-gray-800">
                  {item.productName}
                  {item.productSku && <span className="text-xs text-gray-400 ml-1">#{item.productSku}</span>}
                </td>
                <td className="px-5 py-3 text-gray-500 text-right">{item.quantity} {item.unit}</td>
                <td className="px-5 py-3 text-gray-500 text-right">{formatPrice(item.unitPrice)}</td>
                <td className="px-5 py-3 font-semibold text-right">{formatPrice(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-sm space-y-1">
          <div className="flex justify-between text-gray-500"><span>Sous-total</span><span>{formatPrice(order.subtotal)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Livraison</span><span>{formatPrice(order.deliveryFee)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span style={{ color: "var(--ccb-green)" }}>{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Paiements */}
      {order.payments.length > 0 && (
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Paiement</h3>
          {order.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span>{PAYMENT_LABELS[p.provider] ?? p.provider}</span>
              <span className="text-gray-500">{p.status}</span>
              <span className="font-semibold">{formatPrice(p.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {order.notes && (
        <div className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Notes</h3>
          <p className="text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
