import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const requests = await prisma.customRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ requests });
}
