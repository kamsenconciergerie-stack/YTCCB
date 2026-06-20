import { NextRequest, NextResponse } from "next/server";

/**
 * Vérifie la clé API interne (utilisée par n8n et les webhooks).
 * Les routes admin (session utilisateur) ne passent pas par cette vérification.
 */
export function verifyApiKey(request: NextRequest): NextResponse | null {
  const apiKey = request.headers.get("x-api-key");
  const validKey = process.env.INTERNAL_API_KEY;

  if (!validKey) {
    console.error("INTERNAL_API_KEY non définie dans les variables d'environnement");
    return NextResponse.json({ error: "Configuration serveur incorrecte" }, { status: 500 });
  }

  if (!apiKey || apiKey !== validKey) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return null; // null = clé valide, continuer
}

/** Génère une clé d'idempotence pour les paiements */
export function generateIdempotencyKey(prefix: string, id: string): string {
  return `${prefix}_${id}_${Date.now()}`;
}
