import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { ONLINE_METHOD, paidOrderIds } from '@/lib/payments';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });
  const paid = await paidOrderIds(orders.filter((o) => o.paymentMethod === ONLINE_METHOD).map((o) => o.id));
  return NextResponse.json({ orders, onlinePaidIds: Array.from(paid) });
}
