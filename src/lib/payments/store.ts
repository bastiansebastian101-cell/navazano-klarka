import { prisma } from '../db';

// Online payment state, kept in two small tables created on first use (this
// project has no migrations, so the Prisma schema and existing tables stay untouched):
//   OnlinePayment — every payment attempt at a provider (an order can have retries)
//   OrderPaid     — one row per order once the provider confirms PAID; inserting it
//                   is also the "send the order emails exactly once" guard.

async function ensureTables() {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "OnlinePayment" ("provider" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "orderId" TEXT NOT NULL, "state" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY ("provider", "paymentId"))`
  );
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "OrderPaid" ("orderId" TEXT PRIMARY KEY, "provider" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  );
}

export async function recordPayment(provider: string, paymentId: string, orderId: string, state: string) {
  await ensureTables();
  await prisma.$executeRaw`INSERT INTO "OnlinePayment" ("provider", "paymentId", "orderId", "state") VALUES (${provider}, ${paymentId}, ${orderId}, ${state})`;
}

export async function orderIdForPayment(provider: string, paymentId: string): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ orderId: string }[]>`SELECT "orderId" FROM "OnlinePayment" WHERE "provider" = ${provider} AND "paymentId" = ${paymentId} LIMIT 1`;
    return rows[0]?.orderId ?? null;
  } catch {
    return null; // tables not created yet
  }
}

export async function updatePaymentState(provider: string, paymentId: string, state: string) {
  await prisma.$executeRaw`UPDATE "OnlinePayment" SET "state" = ${state}, "updatedAt" = CURRENT_TIMESTAMP WHERE "provider" = ${provider} AND "paymentId" = ${paymentId}`;
}

/** Marks the order paid. Returns true only for the single call that actually did it. */
export async function markOrderPaidOnce(orderId: string, provider: string, paymentId: string): Promise<boolean> {
  await ensureTables();
  const inserted = await prisma.$queryRaw<{ orderId: string }[]>`
    INSERT INTO "OrderPaid" ("orderId", "provider", "paymentId") VALUES (${orderId}, ${provider}, ${paymentId})
    ON CONFLICT ("orderId") DO NOTHING RETURNING "orderId"`;
  return inserted.length > 0;
}

export async function isOrderPaid(orderId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ orderId: string }[]>`SELECT "orderId" FROM "OrderPaid" WHERE "orderId" = ${orderId} LIMIT 1`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function paidOrderIds(orderIds: string[]): Promise<Set<string>> {
  if (orderIds.length === 0) return new Set();
  try {
    const rows = await prisma.$queryRaw<{ orderId: string }[]>`SELECT "orderId" FROM "OrderPaid" WHERE "orderId" = ANY(${orderIds})`;
    return new Set(rows.map((r) => r.orderId));
  } catch {
    return new Set();
  }
}
