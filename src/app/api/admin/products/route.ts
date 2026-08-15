import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

interface IncomingVariant {
  label: string;
  priceCzk: number;
}

function parseVariants(body: { variants?: unknown }): IncomingVariant[] {
  if (!Array.isArray(body.variants)) return [];
  return body.variants
    .filter(
      (v): v is IncomingVariant =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as IncomingVariant).label === 'string' &&
        (v as IncomingVariant).label.trim() !== '' &&
        Number.isInteger((v as IncomingVariant).priceCzk) &&
        (v as IncomingVariant).priceCzk >= 0
    )
    .map((v) => ({ label: v.label.trim(), priceCzk: v.priceCzk }));
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { variants: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json();

  if (!body.nameCs?.trim() || !body.nameEn?.trim() || !Number.isInteger(body.priceCzk) || body.priceCzk < 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const imageUrls =
    Array.isArray(body.imageUrls) && body.imageUrls.every((u: unknown) => typeof u === 'string')
      ? body.imageUrls.slice(0, 3)
      : [];

  const variants = parseVariants(body);

  const product = await prisma.product.create({
    data: {
      nameCs: body.nameCs.trim(),
      nameEn: body.nameEn.trim(),
      descriptionCs: body.descriptionCs?.trim() ?? '',
      descriptionEn: body.descriptionEn?.trim() ?? '',
      priceCzk: body.priceCzk,
      category: typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'bouquet',
      imageUrls,
      active: body.active ?? true,
      featuredOnHome: body.featuredOnHome ?? false,
      variants: {
        create: variants.map((v, i) => ({ label: v.label, priceCzk: v.priceCzk, sortOrder: i })),
      },
    },
    include: { variants: true },
  });

  return NextResponse.json({ product });
}
