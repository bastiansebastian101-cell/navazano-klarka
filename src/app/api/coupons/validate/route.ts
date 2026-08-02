import { NextRequest, NextResponse } from 'next/server';
import { findValidCoupon, calculateDiscount } from '@/lib/coupon';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!checkRateLimit(`coupon-validate:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code : '';
  const subtotalCzk = Number.isInteger(body.subtotalCzk) ? body.subtotalCzk : NaN;

  if (!code || !Number.isInteger(subtotalCzk) || subtotalCzk < 0) {
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 400 });
  }

  const result = await findValidCoupon(code);
  if (!result.valid) {
    return NextResponse.json({ valid: false, reason: result.reason });
  }

  const discountCzk = calculateDiscount(result.coupon, subtotalCzk);
  return NextResponse.json({
    valid: true,
    discountCzk,
    newTotalCzk: subtotalCzk - discountCzk,
  });
}
