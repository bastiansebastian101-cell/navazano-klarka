import { prisma } from './db';

// GoPay REST API (card, Google Pay, Apple Pay). Docs: https://doc.gopay.com
//
// Turned on only when these env vars are set in Vercel:
//   GOPAY_GOID, GOPAY_CLIENT_ID, GOPAY_CLIENT_SECRET
//   GOPAY_SANDBOX = "false" for real payments (anything else = sandbox/test gateway)
//
// Payment state is kept in two small tables created on first use (this project has
// no migrations, so the Prisma schema and existing tables stay untouched):
//   GopayPayment    — every payment attempt (one order can have retries)
//   GopayOrderPaid  — one row per order once GoPay confirms PAID; inserting it is
//                     also the "send the emails exactly once" guard.

export const GOPAY_METHOD = 'gopay';

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

export function isGopayEnabled(): boolean {
  return config() !== null;
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

// ---------- tracking tables ----------

async function ensureTables() {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "GopayPayment" ("gopayId" TEXT PRIMARY KEY, "orderId" TEXT NOT NULL, "state" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  );
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "GopayOrderPaid" ("orderId" TEXT PRIMARY KEY, "gopayId" TEXT NOT NULL, "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  );
}

/** Is this order paid via GoPay? (false if the tables don't exist yet) */
export async function isOrderPaid(orderId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ orderId: string }[]>`SELECT "orderId" FROM "GopayOrderPaid" WHERE "orderId" = ${orderId} LIMIT 1`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** Paid order ids among the given ones (for the admin list). */
export async function paidOrderIds(orderIds: string[]): Promise<Set<string>> {
  if (orderIds.length === 0) return new Set();
  try {
    const rows = await prisma.$queryRaw<{ orderId: string }[]>`SELECT "orderId" FROM "GopayOrderPaid" WHERE "orderId" = ANY(${orderIds})`;
    return new Set(rows.map((r) => r.orderId));
  } catch {
    return new Set();
  }
}

// ---------- API calls ----------

type OrderForPayment = {
  id: string;
  orderNumber: number;
  customerName: string;
  email: string;
  phone: string;
  totalCzk: number; // haléře
  items: { name: string; quantity: number; priceCzk: number }[];
};

/** Creates a GoPay payment for the order and returns the URL of the payment page. */
export async function createGopayPayment(order: OrderForPayment, appBaseUrl: string): Promise<string> {
  const cfg = config();
  if (!cfg) throw new Error('GoPay not configured');
  await ensureTables();

  const [firstName, ...rest] = order.customerName.trim().split(/\s+/);
  // Item lines must add up to the amount; with a coupon they don't, so send one summary line.
  const itemsSum = order.items.reduce((s, i) => s + i.priceCzk * i.quantity, 0);
  const items =
    itemsSum === order.totalCzk
      ? order.items.map((i) => ({ type: 'ITEM', name: i.name.slice(0, 256), amount: i.priceCzk * i.quantity, count: i.quantity }))
      : [{ type: 'ITEM', name: `Objednávka ${order.orderNumber}`, amount: order.totalCzk, count: 1 }];
  const body = {
    payer: {
      allowed_payment_instruments: ['PAYMENT_CARD', 'GPAY', 'APPLE_PAY'],
      default_payment_instrument: 'PAYMENT_CARD',
      contact: {
        first_name: firstName ?? '',
        last_name: rest.join(' '),
        email: order.email,
        phone_number: order.phone,
      },
    },
    target: { type: 'ACCOUNT', goid: cfg.goid },
    amount: order.totalCzk, // GoPay wants the smallest unit — haléře, same as our DB
    currency: 'CZK',
    order_number: String(order.orderNumber),
    order_description: `Objednávka ${order.orderNumber} — Navázáno by Klára`,
    items,
    callback: {
      return_url: `${appBaseUrl}/api/payments/gopay/return`,
      notification_url: `${appBaseUrl}/api/payments/gopay/notify`,
    },
    lang: 'CS',
  };

  const res = await fetch(`${cfg.baseUrl}/payments/payment`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await accessToken(cfg)}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GoPay create payment failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: number; state: string; gw_url: string };

  await prisma.$executeRaw`INSERT INTO "GopayPayment" ("gopayId", "orderId", "state") VALUES (${String(data.id)}, ${order.id}, ${data.state})`;
  return data.gw_url;
}

/**
 * Asks GoPay for the real state of a payment (never trust the query string alone),
 * stores it, and returns the order id plus whether this call is the one that just
 * marked the order paid (so emails are sent exactly once).
 */
export async function syncGopayPayment(
  gopayId: string
): Promise<{ orderId: string; paid: boolean; justPaid: boolean } | null> {
  const cfg = config();
  if (!cfg || !/^\d+$/.test(gopayId)) return null;
  await ensureTables();

  const rows = await prisma.$queryRaw<{ orderId: string }[]>`SELECT "orderId" FROM "GopayPayment" WHERE "gopayId" = ${gopayId} LIMIT 1`;
  const orderId = rows[0]?.orderId;
  if (!orderId) return null; // not one of ours

  const res = await fetch(`${cfg.baseUrl}/payments/payment/${gopayId}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${await accessToken(cfg)}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`GoPay status failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { state: string };

  await prisma.$executeRaw`UPDATE "GopayPayment" SET "state" = ${data.state}, "updatedAt" = CURRENT_TIMESTAMP WHERE "gopayId" = ${gopayId}`;

  if (data.state !== 'PAID') return { orderId, paid: await isOrderPaid(orderId), justPaid: false };

  const inserted = await prisma.$queryRaw<{ orderId: string }[]>`
    INSERT INTO "GopayOrderPaid" ("orderId", "gopayId") VALUES (${orderId}, ${gopayId})
    ON CONFLICT ("orderId") DO NOTHING RETURNING "orderId"`;
  return { orderId, paid: true, justPaid: inserted.length > 0 };
}
