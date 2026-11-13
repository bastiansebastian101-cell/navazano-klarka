import { prisma } from './db';
import { findValidCoupon } from './coupon';

// The top promo bar shows one coupon chosen by the admin. Which one is stored in a
// tiny key/value table, kept out of the Prisma schema on purpose: this project has
// no migrations and production has drifted before, so we create the table on first
// write with CREATE TABLE IF NOT EXISTS and treat "table missing" as "no banner".
// Coupons, orders and checkout never touch this table.

const KEY = 'promoBannerCouponId';

async function ensureTable() {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "SiteSetting" ("key" TEXT PRIMARY KEY, "value" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  );
}

export async function getBannerCouponId(): Promise<string | null> {
  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`SELECT "value" FROM "SiteSetting" WHERE "key" = ${KEY} LIMIT 1`;
    return rows[0]?.value ?? null;
  } catch {
    return null; // table not created yet
  }
}

export async function setBannerCouponId(couponId: string | null): Promise<void> {
  await ensureTable();
  if (couponId === null) {
    await prisma.$executeRaw`DELETE FROM "SiteSetting" WHERE "key" = ${KEY}`;
    return;
  }
  await prisma.$executeRaw`
    INSERT INTO "SiteSetting" ("key", "value", "updatedAt") VALUES (${KEY}, ${couponId}, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`;
}

export type ActivePromo = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage 1-100, or haléře
  expiresAt: string | null; // ISO
};

/** The coupon to advertise, only if it would really be accepted at checkout right now. */
export async function getActivePromo(): Promise<ActivePromo | null> {
  const id = await getBannerCouponId();
  if (!id) return null;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return null;
  const check = await findValidCoupon(coupon.code);
  if (!check.valid) return null;
  return {
    code: coupon.code,
    discountType: coupon.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: coupon.discountValue,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
  };
}
