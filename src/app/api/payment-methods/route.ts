import { NextResponse } from 'next/server';
import { isOnlinePaymentEnabled } from '@/lib/payments';

export const dynamic = 'force-dynamic';

// Which optional payment methods checkout should offer.
export async function GET() {
  return NextResponse.json({ online: isOnlinePaymentEnabled() }, { headers: { 'Cache-Control': 'no-store' } });
}
