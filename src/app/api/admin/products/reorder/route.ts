import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

// Saves the catalog order chosen in the admin: ids[0] gets place 1, ids[1] place 2, …
export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ids: unknown = body.ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 1000 || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  await prisma.$transaction(
    (ids as string[]).map((id, i) => prisma.product.updateMany({ where: { id }, data: { position: i + 1 } }))
  );
  return NextResponse.json({ ok: true });
}
