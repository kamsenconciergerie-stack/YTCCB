import { createHmac, timingSafeEqual } from "crypto";

const WAVE_API_URL = process.env.WAVE_API_URL ?? "https://api.wave.com/v1";
const WAVE_API_KEY = process.env.WAVE_API_KEY ?? "";
const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET ?? "";

export interface WaveCheckoutSession {
  id: string;
  wave_launch_url: string;
  status: "open" | "processing" | "complete" | "error";
  amount: string;
  currency: string;
  client_reference: string;
  when_completed?: string;
  last_payment_error?: string;
}

export interface WaveWebhookPayload {
  id: string;
  status: "complete" | "error";
  amount: string;
  currency: string;
  client_reference: string;
  when_completed: string;
  business_id: string;
}

/** Crée une session de paiement Wave et retourne l'URL de redirection */
export async function createWaveCheckout(params: {
  amount: number;
  orderId: string;
  orderNumber: string;
  successUrl: string;
  errorUrl: string;
}): Promise<WaveCheckoutSession> {
  if (!WAVE_API_KEY) throw new Error("WAVE_API_KEY non définie");

  const response = await fetch(`${WAVE_API_URL}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WAVE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currency:         "XOF",
      amount:           String(Math.round(params.amount)),
      success_url:      params.successUrl,
      error_url:        params.errorUrl,
      client_reference: params.orderNumber,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Wave API error ${response.status}: ${body}`);
  }

  return response.json();
}

/** Vérifie la signature HMAC-SHA256 du webhook Wave */
export function verifyWaveWebhookSignature(
  rawBody: string,
  signatureHeader: string
): boolean {
  if (!WAVE_WEBHOOK_SECRET) return false;

  // Format : "t=<timestamp>,v1=<signature>"
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("="))
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];

  if (!timestamp || !signature) return false;

  // Rejeter les webhooks de plus de 5 minutes (anti-replay)
  const webhookAge = Date.now() / 1000 - parseInt(timestamp, 10);
  if (webhookAge > 300) return false;

  const expected = createHmac("sha256", WAVE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
