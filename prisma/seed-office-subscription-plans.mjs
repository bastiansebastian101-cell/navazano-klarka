// One-off seed for the flower subscription tiers — safely re-runnable (upsert).
// Prices are a starting proposal; edit anytime from /admin/kancelare without a redeploy.
//
// Replaces the old Classic/Standard/Luxury (monthly-rate + yearly-commitment) tiers with the
// Mini Vases/Small/Medium/Premium Bouquet tiers (flat 1-month / 2-month price), per the printed
// catalogue. The old tier rows are deleted first since their slugs no longer exist.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OLD_TIERS = ['classic', 'standard', 'luxury'];

const plans = [
  {
    tier: 'mini-vases',
    nameCs: 'Mini vázy',
    nameEn: 'Mini Vases',
    descriptionCs: 'Drobné, originální vázičky, které se vzájemně doplňují a liší. Jednotlivé růže a sezónní zeleň. Ideální pro více míst najednou — kavárny a firemní akce.',
    descriptionEn: 'Tiny, distinct bud vases, curated to complement and differ. Features include single spray roses and seasonal foliage. Perfect for multiple spaces.',
    price1MonthCzk: 300000,
    price2MonthCzk: 600000,
    sortOrder: 0,
  },
  {
    tier: 'small-bouquet',
    nameCs: 'Malá kytice',
    nameEn: 'Small Bouquet',
    descriptionCs: 'Ručně vázaná kytice ze sezónních květin (např. pryskyřník a hrachor). Jemná, decentní a elegantní úprava.',
    descriptionEn: 'Hand-tied, mixed seasonal bouquet (like ranunculus and sweet pea). Soft, delicate, and elegant presentation.',
    price1MonthCzk: 250000,
    price2MonthCzk: 500000,
    sortOrder: 1,
  },
  {
    tier: 'medium-bouquet',
    nameCs: 'Střední kytice',
    nameEn: 'Medium Bouquet',
    descriptionCs: 'Plnohodnotná dekorace se stylovým objemem. Zahradní růže, hortenzie, stračky a pestrá zeleň pro bohatý vzhled — ideální na jídelní stůl.',
    descriptionEn: 'Full centerpiece with styled dimension. Garden roses, hydrangeas, delphiniums, and varied foliage for a lush look. Perfect for dining tables.',
    price1MonthCzk: 400000,
    price2MonthCzk: 800000,
    sortOrder: 2,
  },
  {
    tier: 'premium-bouquet',
    nameCs: 'Prémiová kytice',
    nameEn: 'Premium Bouquet',
    descriptionCs: 'Velkolepá reprezentativní kompozice. Luxusní růže, lilie a orchideje ve velkých, architektonických vázách.',
    descriptionEn: 'Magnificent statement arrangement. Features high-scale blooms (luxury roses, lilies, orchids) in large, architectural vases.',
    price1MonthCzk: 600000,
    price2MonthCzk: 1200000,
    sortOrder: 3,
  },
];

await prisma.officeSubscriptionPlan.deleteMany({ where: { tier: { in: OLD_TIERS } } });

for (const p of plans) {
  await prisma.officeSubscriptionPlan.upsert({ where: { tier: p.tier }, update: p, create: p });
}

console.log(`Seeded ${plans.length} flower subscription plans (removed old Classic/Standard/Luxury tiers).`);
await prisma.$disconnect();
