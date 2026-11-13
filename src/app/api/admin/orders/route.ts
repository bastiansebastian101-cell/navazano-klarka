import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { paidOrderIds } from '@/lib/gopay';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });
  const gopayPaid = await paidOrderIds(orders.filter((o) => o.paymentMethod === 'gopay').map((o) => o.id));
  return NextResponse.json({ orders, gopayPaidIds: Array.from(gopayPaid) });
}
