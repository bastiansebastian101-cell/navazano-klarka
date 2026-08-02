import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { normalizeCouponCode } from '@/lib/coupon';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json();

  const code = typeof body.code === 'string' ? normalizeCouponCode(body.code) : '';
  const discountType = body.discountType;
  const discountValue = body.discountValue;

  if (!code) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  }
  if (discountType !== 'percentage' && discountType !== 'fixed') {
    return NextResponse.json({ error: 'invalid_discount_type' }, { status: 400 });
  }
  if (!Number.isInteger(discountValue) || discountValue <= 0) {
    return NextResponse.json({ error: 'invalid_discount_value' }, { status: 400 });
  }
  if (discountType === 'percentage' && discountValue > 100) {
    return NextResponse.json({ error: 'invalid_discount_value' }, { status: 400 });
  }

  const maxRedemptions =
    body.maxRedemptions === null || body.maxRedemptions === undefined || body.maxRedemptions === ''
      ? null
      : Number.isInteger(body.maxRedemptions) && body.maxRedemptions > 0
        ? body.maxRedemptions
        : undefined;
  if (maxRedemptions === undefined) {
    return NextResponse.json({ error: 'invalid_max_redemptions' }, { status: 400 });
  }

  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: 'invalid_expires_at' }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: { code, discountType, discountValue, maxRedemptions, expiresAt, active: true },
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: 'code_taken' }, { status: 409 });
  }
}
