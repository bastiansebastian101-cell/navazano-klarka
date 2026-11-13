import type { OrderForPayment, PaymentProvider, PaymentState } from './types';

// GoPay REST API — https://doc.gopay.com
// Env: GOPAY_GOID, GOPAY_CLIENT_ID, GOPAY_CLIENT_SECRET; GOPAY_SANDBOX="false" for live (default = test gateway).
// Return:       /api/payments/gopay/return?id=<paymentId>   (GoPay appends ?id=)
// Notification: /api/payments/gopay/notify?id=<paymentId>   (set per payment)

type Config = { goid: number; clientId: string; clientSecret: string; baseUrl: string };

function config(): Config | null {
  const goid = Number(process.env.GOPAY_GOID);
  const clientId = process.env.GOPAY_CLIENT_ID;
  const clientSecret = process.env.GOPAY_CLIENT_SECRET;
  if (!goid || !clientId || !clientSecret) return null;
  const baseUrl =
    process.env.GOPAY_SANDBOX === 'false' ? 'https://gate.gopay.cz/api' : 'https://gw.sandbox.gopay.com/api';
  return { goid, clientId, clientSecret, baseUrl };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(cfg: Config): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch(`${cfg.baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials&scope=payment-all',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GoPay token failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

function normalise(raw: string): PaymentState {
  if (raw === 'PAID') return 'PAID';
  if (raw === 'CANCELED' || raw === 'TIMEOUTED') return 'CANCELLED';
  if (raw === 'CREATED' || raw === 'PAYMENT_METHOD_CHOSEN' || raw === 'AUTHORIZED') return 'PENDING';
  return 'OTHER';
}

export const gopay: PaymentProvider = {
  name: 'gopay',
  isConfigured: () => config() !== null,

  async create(order: OrderForPayment, appBaseUrl: string) {
    const cfg = config();
    if (!cfg) throw new Error('GoPay not configured');

    const [firstName, ...rest] = order.customerName.trim().split(/\s+/);
    // Item lines must add up to the amount; with a coupon they don't, so send one summary line.
    const itemsSum = order.items.reduce((s, i) => s + i.priceCzk * i.quantity, 0);
    const items =
      itemsSum === order.totalCzk
        ? order.items.map((i) => ({ type: 'ITEM', name: i.name.slice(0, 256), amount: i.priceCzk * i.quantity, count: i.quantity }))
        : [{ type: 'ITEM', name: `Objednávka ${order.orderNumber}`, amount: order.totalCzk, count: 1 }];

    const res = await fetch(`${cfg.baseUrl}/payments/payment`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await accessToken(cfg)}`,
      },
      body: JSON.stringify({
        payer: {
          allowed_payment_instruments: ['PAYMENT_CARD', 'GPAY', 'APPLE_PAY'],
          default_payment_instrument: 'PAYMENT_CARD',
          contact: { first_name: firstName ?? '', last_name: rest.join(' '), email: order.email, phone_number: order.phone },
        },
        target: { type: 'ACCOUNT', goid: cfg.goid },
        amount: order.totalCzk, // smallest unit (haléře), same as our DB
        currency: 'CZK',
        order_number: String(order.orderNumber),
        order_description: `Objednávka ${order.orderNumber} — Navázáno by Klára`,
        items,
        callback: {
          return_url: `${appBaseUrl}/api/payments/gopay/return`,
          notification_url: `${appBaseUrl}/api/payments/gopay/notify`,
        },
        lang: 'CS',
      }),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`GoPay create payment failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { id: number; state: string; gw_url: string };
    return { paymentId: String(data.id), redirectUrl: data.gw_url, state: data.state };
  },

  async getState(paymentId: string) {
    const cfg = config();
    if (!cfg) throw new Error('GoPay not configured');
    const res = await fetch(`${cfg.baseUrl}/payments/payment/${encodeURIComponent(paymentId)}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${await accessToken(cfg)}` },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`GoPay status failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { state: string };
    return { raw: data.state, state: normalise(data.state) };
  },
};
