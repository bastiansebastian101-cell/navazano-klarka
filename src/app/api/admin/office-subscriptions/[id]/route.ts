import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body.markContacted !== true) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const inquiry = await prisma.officeSubscriptionInquiry.update({
    where: { id: params.id },
    data: { contactedAt: new Date() },
  });

  return NextResponse.json({ success: true, inquiry });
}
