import { NextResponse } from "next/server";
// Route publique dépréciée — utiliser PATCH /api/admin/orders/[id]/status (admin auth requis)
// ou PATCH /api/n8n/order-status (api-key requis)
export async function PATCH() {
  return NextResponse.json({ error: "Utiliser PATCH /api/admin/orders/[id]/status ou /api/n8n/order-status" }, { status: 301 });
}
