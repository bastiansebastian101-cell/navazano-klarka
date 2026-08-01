import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

const VALID_STATUSES = ['new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json();

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id: params.id }, data: { status: body.status } });
  return NextResponse.json({ order });
}
