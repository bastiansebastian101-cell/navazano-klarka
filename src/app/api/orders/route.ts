import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isDeliveryDateValid, isDeliveryWindowValid } from '@/lib/delivery';
import { sendOrderConfirmationEmail, sendNewOrderAlertEmail } from '@/lib/email';

interface OrderRequestBody {
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  deliveryDate: string; // ISO date
  deliveryWindow: string;
  paymentMethod: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: OrderRequestBody = await request.json();

    if (
      !body.customerName?.trim() ||
      !body.phone?.trim() ||
      !body.email?.trim() ||
      !body.deliveryAddress?.trim() ||
      !body.deliveryDate ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    if (!['bank_transfer', 'cash_on_delivery'].includes(body.paymentMethod)) {
      return NextResponse.json({ error: 'invalid_payment_method' }, { status: 400 });
    }

    if (!isDeliveryWindowValid(body.deliveryWindow)) {
      return NextResponse.json({ error: 'invalid_delivery_window' }, { status: 400 });
    }

    const deliveryDate = new Date(body.deliveryDate);
    if (Number.isNaN(deliveryDate.getTime()) || !isDeliveryDateValid(deliveryDate)) {
      return NextResponse.json({ error: 'invalid_delivery_date' }, { status: 400 });
    }

    // Never trust client-submitted prices — look products up fresh and price
    // the order server-side from what's actually active in the catalog.
    const productIds = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItems: { productId: string; quantity: number; priceCzk: number }[] = [];
    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'invalid_item' }, { status: 400 });
      }
      orderItems.push({ productId: product.id, quantity: item.quantity, priceCzk: product.priceCzk });
    }

    const totalCzk = orderItems.reduce((sum, i) => sum + i.priceCzk * i.quantity, 0);

    const customerName = body.customerName.trim();
    const phone = body.phone.trim();
    const email = body.email.trim();

    // Auto-create/update a Customer record so returning shoppers (matched by
    // email) can look up their order history later via the magic-link login —
    // this doesn't add any new required checkout field or change the flow.
    const customer = await prisma.customer.upsert({
      where: { email },
      create: { email, name: customerName, phone },
      update: { name: customerName, phone },
    });

    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        email,
        deliveryAddress: body.deliveryAddress.trim(),
        deliveryDate,
        deliveryWindow: body.deliveryWindow,
        paymentMethod: body.paymentMethod,
        notes: body.notes?.trim() || null,
        totalCzk,
        customerId: customer.id,
        items: { create: orderItems },
      },
      include: { items: { include: { product: true } } },
    });

    const emailData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.email,
      deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate,
      deliveryWindow: order.deliveryWindow,
      paymentMethod: order.paymentMethod,
      totalCzk: order.totalCzk,
      items: order.items.map((i) => ({ nameCs: i.product.nameCs, quantity: i.quantity, priceCzk: i.priceCzk })),
    };

    await Promise.all([sendOrderConfirmationEmail(emailData), sendNewOrderAlertEmail(emailData)]);

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
