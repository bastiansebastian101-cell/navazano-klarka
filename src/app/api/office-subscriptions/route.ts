import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOfficeSubscriptionInquiryEmail } from '@/lib/email';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIERS = ['mini-vases', 'small-bouquet', 'medium-bouquet', 'premium-bouquet'];
const DURATIONS = ['1month', '2month'];

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
  const duration = typeof body.duration === 'string' ? body.duration : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) || null : null;

  if (
    !companyName || !contactName || !phone || !deliveryAddress ||
    !EMAIL_RE.test(email) || !TIERS.includes(planTier) || !DURATIONS.includes(duration)
  ) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const plan = await prisma.officeSubscriptionPlan.findUnique({ where: { tier: planTier } });
  if (!plan || !plan.active) {
    return NextResponse.json({ error: 'invalid_plan' }, { status: 400 });
  }

  // Never trust a client-submitted price — resolve it server-side from the plan row.
  const priceCzk = duration === '2month' ? plan.price2MonthCzk : plan.price1MonthCzk;

  const inquiry = await prisma.officeSubscriptionInquiry.create({
    data: { companyName, contactName, email, phone, deliveryAddress, planTier, duration, priceCzk, message },
  });

  await sendOfficeSubscriptionInquiryEmail({
    companyName,
    contactName,
    email,
    phone,
    deliveryAddress,
    planNameCs: plan.nameCs,
    duration,
    priceCzk,
    message,
  });

  return NextResponse.json({ success: true, id: inquiry.id });
}
