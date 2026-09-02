// One-off seed for the office subscription tiers — safely re-runnable (upsert).
// Prices are a starting proposal; edit anytime from /admin/kancelare without a redeploy.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    tier: 'classic',
    nameCs: 'Classic',
    nameEn: 'Classic',
    descriptionCs: 'Menší, běžné květiny — svěží kytice do vázy dvakrát týdně.',
    descriptionEn: 'Small, everyday flowers — a fresh bouquet in a vase, twice a week.',
    priceMonthlyCzk: 520000,
    priceYearlyCommitmentCzk: 490000,
    sortOrder: 0,
  },
  {
    tier: 'standard',
    nameCs: 'Standard',
    nameEn: 'Standard',
    descriptionCs: 'Vyšší třída květin, více elegance pro vaši kancelář.',
    descriptionEn: 'Higher-class flowers, more elegance for your office.',
    priceMonthlyCzk: 700000,
    priceYearlyCommitmentCzk: 665000,
    sortOrder: 1,
  },
  {
    tier: 'luxury',
    nameCs: 'Luxury',
    nameEn: 'Luxury',
    descriptionCs: 'VIP elegance a špičkové květiny pro výjimečný dojem.',
    descriptionEn: 'VIP elegance and top-tier flowers for an exceptional impression.',
    priceMonthlyCzk: 1000000,
    priceYearlyCommitmentCzk: 950000,
    sortOrder: 2,
  },
];

for (const p of plans) {
  await prisma.officeSubscriptionPlan.upsert({ where: { tier: p.tier }, update: {}, create: p });
}

console.log(`Seeded ${plans.length} office subscription plans.`);
await prisma.$disconnect();
