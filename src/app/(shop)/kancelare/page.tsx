import { prisma } from '@/lib/db';
import { OfficeSubscriptionPage } from '@/components/shop/OfficeSubscriptionPage';
import type { OfficeSubscriptionPlan } from '@prisma/client';

export const dynamic = 'force-dynamic';

// TEMPORARY COMPATIBILITY SHIM — the production database still has the old
// columns (priceMonthlyCzk, priceYearlyCommitmentCzk) from before the
// 1-month/2-month flat-pricing model; prisma.officeSubscriptionPlan.findMany
// throws because those columns no longer exist in the Prisma schema. Reading
// via raw SQL against the columns that actually still exist, then mapping
// them into the new shape in JS, sidesteps that without touching the live
// schema. Remove this once the real migration (add price1MonthCzk/
// price2MonthCzk, drop the old two columns) has been run against production
// — see the chat/ops notes for the exact SQL.
async function getActivePlans(): Promise<OfficeSubscriptionPlan[]> {
  const rows = await prisma.$queryRawUnsafe<{
    id: string;
    tier: string;
    nameCs: string;
    nameEn: string;
    descriptionCs: string;
    descriptionEn: string;
    priceMonthlyCzk: number;
    sortOrder: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[]>(
    `SELECT "id", "tier", "nameCs", "nameEn", "descriptionCs", "descriptionEn", "priceMonthlyCzk", "sortOrder", "active", "createdAt", "updatedAt"
     FROM "OfficeSubscriptionPlan" WHERE "active" = true ORDER BY "sortOrder" ASC;`,
  );

  return rows.map((r) => ({
    id: r.id,
    tier: r.tier,
    nameCs: r.nameCs,
    nameEn: r.nameEn,
    descriptionCs: r.descriptionCs,
    descriptionEn: r.descriptionEn,
    price1MonthCzk: r.priceMonthlyCzk,
    price2MonthCzk: r.priceMonthlyCzk * 2,
    sortOrder: r.sortOrder,
    active: r.active,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export default async function KancelarePage() {
  const plans = await getActivePlans();

  return <OfficeSubscriptionPage plans={plans} />;
}
