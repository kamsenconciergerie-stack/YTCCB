import { prisma } from "./prisma";

/**
 * Génère un numéro de commande lisible : CCB-YYYYMM-NNNN
 * Le compteur repart à 1 chaque mois.
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const startOfMonth = new Date(year, now.getMonth(), 1);
  const count = await prisma.order.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  const seq = String(count + 1).padStart(4, "0");
  return `CCB-${year}${month}-${seq}`;
}

/**
 * Normalise un numéro WhatsApp sénégalais au format +221XXXXXXXXX
 * Gère les cas : "0033...", "33...", "221...", "7X XXX XX XX"
 */
export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  // Déjà avec indicatif international complet
  if (digits.startsWith("221") && digits.length === 12) {
    return `+${digits}`;
  }
  // Numéro local 9 chiffres commençant par 7
  if (digits.length === 9 && digits.startsWith("7")) {
    return `+221${digits}`;
  }

  // Retourner tel quel avec + si non reconnu (laisser la validation Zod gérer)
  return digits.startsWith("+") ? raw.trim() : `+${digits}`;
}
