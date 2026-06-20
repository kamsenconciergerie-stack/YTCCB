const OM_TOKEN_URL =
  process.env.ORANGE_MONEY_TOKEN_URL ??
  "https://api.orange.com/oauth/v3/token";

const OM_PAYMENT_URL =
  process.env.ORANGE_MONEY_PAYMENT_URL ??
  "https://api.orange.com/orange-money-webpay/sn/v1/webpayment";

const OM_CLIENT_ID     = process.env.ORANGE_MONEY_CLIENT_ID ?? "";
const OM_CLIENT_SECRET = process.env.ORANGE_MONEY_CLIENT_SECRET ?? "";
const OM_MERCHANT_KEY  = process.env.ORANGE_MONEY_MERCHANT_KEY ?? "";

interface OrangeMoneyToken {
  access_token: string;
  expires_in: number;
}

export interface OrangeMoneyPaymentResponse {
  payment_url: string;
  pay_token: string;
  notif_token: string;
}

export interface OrangeMoneyWebhookPayload {
  status: string;
  txnid: string;
  txnmode: string;
  inittxnmessage: string;
  inittxnstatus: string;
  confirmtxnstatus: string;
  confirmtxnmessage: string;
  notif_token: string;
  pay_token: string;
  txntype: string;
  amount: string;
  sms: string;
  phone: string;
}

async function getAccessToken(): Promise<string> {
  if (!OM_CLIENT_ID || !OM_CLIENT_SECRET) {
    throw new Error("ORANGE_MONEY_CLIENT_ID / CLIENT_SECRET non définies");
  }

  const credentials = Buffer.from(`${OM_CLIENT_ID}:${OM_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(OM_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Orange Money token error ${response.status}`);
  }

  const data: OrangeMoneyToken = await response.json();
  return data.access_token;
}

/** Initie un paiement Orange Money WebPay et retourne l'URL de paiement */
export async function initiateOrangeMoneyPayment(params: {
  amount: number;
  orderId: string;
  orderNumber: string;
  returnUrl: string;
  cancelUrl: string;
  notifUrl: string;
}): Promise<OrangeMoneyPaymentResponse> {
  if (!OM_MERCHANT_KEY) throw new Error("ORANGE_MONEY_MERCHANT_KEY non définie");

  const accessToken = await getAccessToken();

  const response = await fetch(OM_PAYMENT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_key: OM_MERCHANT_KEY,
      currency:     "OUV",         // code Orange Money Sénégal
      order_id:     params.orderNumber,
      amount:       String(Math.round(params.amount)),
      return_url:   params.returnUrl,
      cancel_url:   params.cancelUrl,
      notif_url:    params.notifUrl,
      lang:         "fr",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Orange Money payment error ${response.status}: ${body}`);
  }

  return response.json();
}

/** Vérifie qu'un webhook Orange Money correspond bien à un paiement connu */
export function verifyOrangeMoneyWebhook(
  payload: OrangeMoneyWebhookPayload,
  storedNotifToken: string
): boolean {
  // Orange Money ne fournit pas de signature HMAC — on vérifie le notif_token
  // stocké lors de l'initiation du paiement
  return (
    payload.notif_token === storedNotifToken &&
    payload.confirmtxnstatus === "200"
  );
}
