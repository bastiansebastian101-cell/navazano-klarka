import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOfficeSubscriptionInquiryEmail } from '@/lib/email';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIERS = ['classic', 'standard', 'luxury'];
const COMMITMENTS = ['monthly', 'yearly'];

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!checkRateLimit(`office-subscription:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';
  const contactName = typeof body.contactName === 'string' ? body.contactName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const deliveryAddress = typeof body.deliveryAddress === 'string' ? body.deliveryAddress.trim() : '';
  const planTier = typeof body.planTier === 'string' ? body.planTier : '';
  const commitment = typeof body.commitment === 'string' ? body.commitment : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) || null : null;

  if (
    !companyName || !contactName || !phone || !deliveryAddress ||
    !EMAIL_RE.test(email) || !TIERS.includes(planTier) || !COMMITMENTS.includes(commitment)
  ) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const plan = await prisma.officeSubscriptionPlan.findUnique({ where: { tier: planTier } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
  }

  // Never trust a client-submitted price — resolve it server-side from the plan row.
  const priceCzk = commitment === 'yearly' ? plan.priceYearlyCommitmentCzk : plan.priceMonthlyCzk;

  const inquiry = await prisma.officeSubscriptionInquiry.create({
    data: { companyName, contactName, email, phone, deliveryAddress, planTier, commitment, priceCzk, message },
  });

  await sendOfficeSubscriptionInquiryEmail({
    companyName,
    contactName,
    email,
    phone,
    deliveryAddress,
    planNameCs: plan.nameCs,
    commitment,
    priceCzk,
    message,
  });

  return NextResponse.json({ success: true, id: inquiry.id });
}
