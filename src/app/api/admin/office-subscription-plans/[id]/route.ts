import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.nameCs === 'string' && body.nameCs.trim()) data.nameCs = body.nameCs.trim();
  if (typeof body.nameEn === 'string' && body.nameEn.trim()) data.nameEn = body.nameEn.trim();
  if (typeof body.descriptionCs === 'string' && body.descriptionCs.trim()) data.descriptionCs = body.descriptionCs.trim();
  if (typeof body.descriptionEn === 'string' && body.descriptionEn.trim()) data.descriptionEn = body.descriptionEn.trim();
  if (Number.isInteger(body.price1MonthCzk) && body.price1MonthCzk > 0) data.price1MonthCzk = body.price1MonthCzk;
  if (Number.isInteger(body.price2MonthCzk) && body.price2MonthCzk > 0) {
    data.price2MonthCzk = body.price2MonthCzk;
  }
  if (typeof body.active === 'boolean') data.active = body.active;

  const plan = await prisma.officeSubscriptionPlan.update({ where: { id: params.id }, data });
  return NextResponse.json({ plan });
}
