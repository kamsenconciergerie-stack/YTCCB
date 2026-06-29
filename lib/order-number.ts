import { prisma } from "./prisma";

/**
 * Génère un numéro de commande lisible : MTS-YYYYMMDD-XXXX
 * Le compteur repart à 1 chaque jour.
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateStr = `${y}${m}${d}`;

  const startOfDay = new Date(y, now.getMonth(), now.getDate());
  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfDay } },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `MTS-${dateStr}-${seq}`;
}

/**
 * Calcule la date d'expiration d'une commande (30 min après création).
 */
export function orderExpiresAt(): Date {
  return new Date(Date.now() + 30 * 60 * 1000);
}

/**
 * Normalise un numéro WhatsApp sénégalais au format +221XXXXXXXXX
 */
export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("221") && digits.length === 12) return `+${digits}`;
  if (digits.length === 9 && digits.startsWith("7")) return `+221${digits}`;
  return digits.startsWith("+") ? raw.trim() : `+${digits}`;
}
