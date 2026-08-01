import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendLoginLinkEmail } from '@/lib/email';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

const GENERIC_MESSAGE = 'Pokud je e-mail zaregistrován, odeslali jsme na něj přihlašovací odkaz.';

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!checkRateLimit(`login-link:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again in 15 minutes.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ error: 'email_required' }, { status: 400 });
  }

  // Always respond with the same generic message regardless of whether the
  // email matches a real customer, so this endpoint can't be used to check
  // which emails have placed orders.
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (customer) {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.loginToken.create({
      data: { token, email, expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navazano.cz';
    await sendLoginLinkEmail(email, `${baseUrl}/api/auth/verify?token=${token}`);
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
