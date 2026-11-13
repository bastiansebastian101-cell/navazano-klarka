import { NextResponse } from 'next/server';
import { isGopayEnabled } from '@/lib/gopay';

export const dynamic = 'force-dynamic';

// Which optional payment methods checkout should offer.
export async function GET() {
  return NextResponse.json({ gopay: isGopayEnabled() }, { headers: { 'Cache-Control': 'no-store' } });
}
