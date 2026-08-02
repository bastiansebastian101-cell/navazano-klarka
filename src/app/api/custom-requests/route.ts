import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCustomRequestEmail } from '@/lib/email';
import { checkRateLimit, getIp } from '@/lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  if (!checkRateLimit(`custom-request:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : null;

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const customRequest = await prisma.customRequest.create({
    data: { name, email, message, imageUrl },
  });

  await sendCustomRequestEmail({ name, email, message, imageUrl });

  return NextResponse.json({ success: true, id: customRequest.id });
}
