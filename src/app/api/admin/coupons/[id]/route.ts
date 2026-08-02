import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body.active === 'boolean') data.active = body.active;

  const coupon = await prisma.coupon.update({ where: { id: params.id }, data });
  return NextResponse.json({ coupon });
}
