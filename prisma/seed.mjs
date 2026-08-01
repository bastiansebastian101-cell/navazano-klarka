// One-off dev seed — placeholder products only, replace via /admin/produkty with real bouquets.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const placeholders = [
  {
    nameCs: 'Jarní kytice',
    nameEn: 'Spring bouquet',
    descriptionCs: 'Pastelová kytice z čerstvých jarních květin.',
    descriptionEn: 'A pastel bouquet of fresh spring flowers.',
    priceCzk: 69900,
    category: 'bouquet',
    imageUrl: null,
  },
  {
    nameCs: 'Růžová romance',
    nameEn: 'Rose romance',
    descriptionCs: 'Klasická kytice z červených růží.',
    descriptionEn: 'A classic bouquet of red roses.',
    priceCzk: 89900,
    category: 'bouquet',
    imageUrl: null,
  },
  {
    nameCs: 'Sukulent v květináči',
    nameEn: 'Potted succulent',
    descriptionCs: 'Nenáročná rostlina jako milý dárek.',
    descriptionEn: 'A low-maintenance plant, a lovely gift.',
    priceCzk: 39900,
    category: 'plant',
    imageUrl: null,
  },
];

for (const p of placeholders) {
  await prisma.product.create({ data: p });
}

console.log(`Seeded ${placeholders.length} placeholder products.`);
await prisma.$disconnect();
