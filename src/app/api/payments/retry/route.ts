import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ONLINE_METHOD, createOnlinePayment, isOrderPaid } from '@/lib/payments';

export const dynamic = 'force-dynamic';

// "Zkusit zaplatit znovu" on the confirmation page: new payment for the same order.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === 'string' ? body.orderId : '';
  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } })
    : null;

  if (!order || order.paymentMethod !== ONLINE_METHOD || order.status === 'cancelled') {
    return NextResponse.json({ error: 'not_payable' }, { status: 400 });
  }
  if (await isOrderPaid(order.id)) {
    return NextResponse.json({ error: 'already_paid' }, { status: 409 });
  }

  try {
    const redirectUrl = await createOnlinePayment(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        totalCzk: order.totalCzk,
        items: order.items.map((i) => ({
          name: i.product.nameCs + (i.variantLabel ? ` (${i.variantLabel})` : ''),
          quantity: i.quantity,
          priceCzk: i.priceCzk,
        })),
      },
      request.nextUrl.origin
    );
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    console.error('Payment retry failed:', err);
    return NextResponse.json({ error: 'payment_unavailable' }, { status: 502 });
  }
}
