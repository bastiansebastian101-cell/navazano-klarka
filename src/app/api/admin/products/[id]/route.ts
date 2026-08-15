import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

interface IncomingVariant {
  id?: string;
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
    .map((v) => ({
      id: typeof v.id === 'string' ? v.id : undefined,
      label: v.label.trim(),
      priceCzk: v.priceCzk,
    }));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.nameCs === 'string') data.nameCs = body.nameCs.trim();
  if (typeof body.nameEn === 'string') data.nameEn = body.nameEn.trim();
  if (typeof body.descriptionCs === 'string') data.descriptionCs = body.descriptionCs.trim();
  if (typeof body.descriptionEn === 'string') data.descriptionEn = body.descriptionEn.trim();
  if (Number.isInteger(body.priceCzk) && body.priceCzk >= 0) data.priceCzk = body.priceCzk;
  if (typeof body.category === 'string' && body.category.trim()) data.category = body.category.trim();
  if (Array.isArray(body.imageUrls) && body.imageUrls.every((u: unknown) => typeof u === 'string')) {
    data.imageUrls = body.imageUrls.slice(0, 3);
  }
  if (typeof body.active === 'boolean') data.active = body.active;
  if (typeof body.featuredOnHome === 'boolean') data.featuredOnHome = body.featuredOnHome;

  const product = await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: params.id }, data });

    // Variants are only synced when the field is actually present in the
    // request — this lets other PATCH callers (e.g. the quick "featured"
    // toggle in the admin list) touch a single field without accidentally
    // wiping every variant by sending an implicit empty array.
    if (Array.isArray(body.variants)) {
      const incoming = parseVariants(body);
      const keepIds = incoming.filter((v) => v.id).map((v) => v.id!);

      await tx.productVariant.deleteMany({
        where: { productId: params.id, id: { notIn: keepIds } },
      });

      for (let i = 0; i < incoming.length; i++) {
        const v = incoming[i];
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { label: v.label, priceCzk: v.priceCzk, sortOrder: i },
          });
        } else {
          await tx.productVariant.create({
            data: { productId: params.id, label: v.label, priceCzk: v.priceCzk, sortOrder: i },
          });
        }
      }
    }

    return tx.product.findUniqueOrThrow({ where: { id: params.id }, include: { variants: true } });
  });

  return NextResponse.json({ product });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Products referenced by past orders (OrderItem) can't be hard-deleted without
  // breaking order history — deactivate instead, same effect on the storefront.
  const hasOrders = await prisma.orderItem.findFirst({ where: { productId: params.id } });
  if (hasOrders) {
    await prisma.product.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ deactivated: true });
  }

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
