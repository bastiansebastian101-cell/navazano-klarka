import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

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

  const product = await prisma.product.update({ where: { id: params.id }, data });
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
