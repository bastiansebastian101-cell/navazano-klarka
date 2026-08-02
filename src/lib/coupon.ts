import type { Coupon } from '@prisma/client';
import { prisma } from './db';

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export type CouponInvalidReason = 'not_found' | 'inactive' | 'expired' | 'exhausted';

export async function findValidCoupon(
  rawCode: string
): Promise<{ valid: true; coupon: Coupon } | { valid: false; reason: CouponInvalidReason }> {
  const code = normalizeCouponCode(rawCode);
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon) return { valid: false, reason: 'not_found' };
  if (!coupon.active) return { valid: false, reason: 'inactive' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, reason: 'expired' };
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { valid: false, reason: 'exhausted' };
  }

  return { valid: true, coupon };
}

export function calculateDiscount(coupon: Coupon, subtotalCzk: number): number {
  if (coupon.discountType === 'percentage') {
    return Math.round((subtotalCzk * coupon.discountValue) / 100);
  }
  // fixed amount — never exceed the subtotal itself
  return Math.min(coupon.discountValue, subtotalCzk);
}
