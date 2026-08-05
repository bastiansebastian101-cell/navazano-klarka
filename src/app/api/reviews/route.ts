import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!checkRateLimit(`review-submit:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const rating = Number.isInteger(body.rating) ? body.rating : null;

  if (!token || !customerName || !comment || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const invite = await prisma.reviewInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (invite.usedAt) return NextResponse.json({ error: 'already_used' }, { status: 409 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: 'expired' }, { status: 410 });

  const existingReview = await prisma.review.findFirst({
    where: invite.orderId ? { orderId: invite.orderId } : { customRequestId: invite.customRequestId! },
  });
  if (existingReview) {
    return NextResponse.json({ error: 'already_reviewed' }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      customerName,
      rating,
      comment,
      orderId: invite.orderId ?? undefined,
      customRequestId: invite.customRequestId ?? undefined,
    },
  });

  await prisma.reviewInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });

  return NextResponse.json({ success: true, id: review.id });
}
