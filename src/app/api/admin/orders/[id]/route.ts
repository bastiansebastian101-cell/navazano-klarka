import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { createAndSendReviewInvite } from '@/lib/reviewInvite';

const VALID_STATUSES = ['new', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled'];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json();

  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (body.resendReviewInvite === true) {
    const sent = await createAndSendReviewInvite({
      email: existing.email,
      customerName: existing.customerName,
      orderId: existing.id,
    });
    await prisma.order.update({ where: { id: existing.id }, data: { reviewInviteSentAt: new Date() } });
    return NextResponse.json({ success: true, sent });
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 });
  }

  const order = await prisma.order.update({ where: { id: params.id }, data: { status: body.status } });

  if (existing.status !== 'delivered' && body.status === 'delivered' && !existing.reviewInviteSentAt) {
    const sent = await createAndSendReviewInvite({
      email: order.email,
      customerName: order.customerName,
      orderId: order.id,
    });
    if (sent) {
      await prisma.order.update({ where: { id: order.id }, data: { reviewInviteSentAt: new Date() } });
    }
  }

  return NextResponse.json({ order });
}
