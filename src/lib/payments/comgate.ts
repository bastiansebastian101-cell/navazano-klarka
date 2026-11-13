import type { OrderForPayment, PaymentProvider, PaymentState } from './types';

// Comgate REST API v2.0 — https://apidoc.comgate.cz/en/api/rest/
// Env: COMGATE_MERCHANT, COMGATE_SECRET; COMGATE_TEST="false" for real payments (default = test payments).
// Return:       per-payment url_paid / url_cancelled / url_pending -> /api/payments/comgate/return?id=${id}
// Notification: set "Result URL" in the Comgate client portal to /api/payments/comgate/notify

const BASE = 'https://payments.comgate.cz/v2.0';

function config(): { merchant: string; secret: string; test: boolean } | null {
  const merchant = process.env.COMGATE_MERCHANT;
  const secret = process.env.COMGATE_SECRET;
  if (!merchant || !secret) return null;
  return { merchant, secret, test: process.env.COMGATE_TEST !== 'false' };
}

function authHeader(cfg: { merchant: string; secret: string }) {
  return 'Basic ' + Buffer.from(`${cfg.merchant}:${cfg.secret}`).toString('base64');
}

function normalise(raw: string): PaymentState {
  if (raw === 'PAID') return 'PAID';
  if (raw === 'CANCELLED') return 'CANCELLED';
  if (raw === 'PENDING' || raw === 'AUTHORIZED') return 'PENDING';
  return 'OTHER';
}

export const comgate: PaymentProvider = {
  name: 'comgate',
  isConfigured: () => config() !== null,

  async create(order: OrderForPayment, appBaseUrl: string) {
    const cfg = config();
    if (!cfg) throw new Error('Comgate not configured');

    // Comgate replaces ${id} with its transaction id when redirecting the customer back.
    const back = `${appBaseUrl}/api/payments/comgate/return?id=\${id}`;
    const res = await fetch(`${BASE}/payment.json`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: authHeader(cfg) },
      body: JSON.stringify({
        test: cfg.test,
        country: 'CZ',
        price: order.totalCzk, // smallest unit (haléře), same as our DB
        curr: 'CZK',
        label: `Objednavka ${order.orderNumber}`.slice(0, 16),
        refId: String(order.orderNumber),
        method: 'ALL', // card, Google Pay, Apple Pay, bank buttons — whatever is enabled for the shop
        email: order.email,
        phone: order.phone,
        fullName: order.customerName,
        lang: 'cs',
        url_paid: back,
        url_cancelled: back,
        url_pending: back,
      }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number; message?: string; transId?: string; redirect?: string };
    if (!res.ok || data.code !== 0 || !data.transId || !data.redirect) {
      throw new Error(`Comgate create payment failed: ${res.status} ${data.code} ${data.message}`);
    }
    return { paymentId: data.transId, redirectUrl: data.redirect, state: 'PENDING' };
  },

  async getState(paymentId: string) {
    const cfg = config();
    if (!cfg) throw new Error('Comgate not configured');
    const res = await fetch(`${BASE}/payment/transId/${encodeURIComponent(paymentId)}.json`, {
      headers: { Accept: 'application/json', Authorization: authHeader(cfg) },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number; message?: string; status?: string };
    if (!res.ok || data.code !== 0 || !data.status) {
      throw new Error(`Comgate status failed: ${res.status} ${data.code} ${data.message}`);
    }
    return { raw: data.status, state: normalise(data.status) };
  },
};
