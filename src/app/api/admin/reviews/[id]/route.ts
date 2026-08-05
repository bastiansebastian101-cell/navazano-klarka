import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const rating = Number.isInteger(body.rating) ? body.rating : null;

  if (!customerName || !comment || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const review = await prisma.review.update({
    where: { id: params.id },
    data: { customerName, comment, rating, editedAt: new Date() },
  });

  return NextResponse.json({ review });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await prisma.review.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
