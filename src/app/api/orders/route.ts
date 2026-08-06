import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isDeliveryDateValid, isDeliveryWindowValid } from '@/lib/delivery';
import { sendOrderConfirmationEmail, sendNewOrderAlertEmail } from '@/lib/email';
import { findValidCoupon, calculateDiscount } from '@/lib/coupon';

interface OrderRequestBody {
  customerName: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  deliveryDate: string; // ISO date
  deliveryWindow: string;
  notes?: string;
  couponCode?: string;
  occasionReason?: string;
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

    const subtotalCzk = orderItems.reduce((sum, i) => sum + i.priceCzk * i.quantity, 0);

    // Never trust a client-computed discount — re-validate the coupon and
    // recompute it server-side from the server-priced subtotal above.
    let discountCzk = 0;
    let couponId: string | null = null;
    let couponMaxRedemptions: number | null = null;
    const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim() : '';

    if (couponCode) {
      const result = await findValidCoupon(couponCode);
      if (!result.valid) {
        return NextResponse.json({ error: 'invalid_coupon', reason: result.reason }, { status: 400 });
      }
      discountCzk = calculateDiscount(result.coupon, subtotalCzk);
      couponId = result.coupon.id;
      couponMaxRedemptions = result.coupon.maxRedemptions;
    }

    const totalCzk = subtotalCzk - discountCzk;

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

    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        if (couponId) {
          // Atomically claim a redemption slot — Postgres re-evaluates this
          // WHERE against the latest committed row if a concurrent request
          // is racing for the last slot, so this can't over-redeem a coupon.
          const claim = await tx.coupon.updateMany({
            where: {
              id: couponId,
              active: true,
              ...(couponMaxRedemptions !== null ? { redemptionCount: { lt: couponMaxRedemptions } } : {}),
            },
            data: { redemptionCount: { increment: 1 } },
          });
          if (claim.count !== 1) {
            throw new Error('COUPON_EXHAUSTED');
          }
        }

        return tx.order.create({
          data: {
            customerName,
            phone,
            email,
            deliveryAddress: body.deliveryAddress.trim(),
            deliveryDate,
            deliveryWindow: body.deliveryWindow,
            paymentMethod: 'bank_transfer', // only payment method offered — never trust client input here
            notes: body.notes?.trim() || null,
            totalCzk,
            discountCzk,
            customerId: customer.id,
            couponId,
            occasionReason: body.occasionReason?.trim().slice(0, 200) || null,
            items: { create: orderItems },
          },
          include: { items: { include: { product: true } } },
        });
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'COUPON_EXHAUSTED') {
        return NextResponse.json({ error: 'invalid_coupon', reason: 'exhausted' }, { status: 400 });
      }
      throw err;
    }

    const emailData = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.email,
      deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate,
      deliveryWindow: order.deliveryWindow,
      paymentMethod: order.paymentMethod,
      subtotalCzk,
      discountCzk: order.discountCzk,
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
