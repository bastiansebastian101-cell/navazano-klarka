import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { getBannerCouponId, setBannerCouponId } from '@/lib/promoBanner';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ couponId: await getBannerCouponId() });
}

// Body: { couponId: string | null } — null removes the bar.
export async function PUT(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const couponId = body.couponId;

  if (couponId !== null && typeof couponId !== 'string') {
    return NextResponse.json({ error: 'invalid_coupon' }, { status: 400 });
  }
  if (couponId) {
    const exists = await prisma.coupon.findUnique({ where: { id: couponId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: 'invalid_coupon' }, { status: 400 });
  }

  await setBannerCouponId(couponId);
  return NextResponse.json({ couponId });
}
