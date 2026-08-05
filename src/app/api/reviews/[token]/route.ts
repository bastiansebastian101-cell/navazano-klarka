import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const invite = await prisma.reviewInvite.findUnique({ where: { token: params.token } });

  if (!invite) return NextResponse.json({ valid: false, reason: 'not_found' });
  if (invite.usedAt) return NextResponse.json({ valid: false, reason: 'used' });
  if (invite.expiresAt < new Date()) return NextResponse.json({ valid: false, reason: 'expired' });

  let customerName = '';
  if (invite.orderId) {
    const order = await prisma.order.findUnique({ where: { id: invite.orderId }, select: { customerName: true } });
    customerName = order?.customerName ?? '';
  } else if (invite.customRequestId) {
    const cr = await prisma.customRequest.findUnique({ where: { id: invite.customRequestId }, select: { name: true } });
    customerName = cr?.name ?? '';
  }

  return NextResponse.json({ valid: true, customerName });
}
