import { NextResponse } from 'next/server';
import { getActivePromo } from '@/lib/promoBanner';

export const dynamic = 'force-dynamic';

// Public: what the top promo bar should show (or null).
export async function GET() {
  try {
    const promo = await getActivePromo();
    return NextResponse.json({ promo }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('promo-banner error:', err);
    return NextResponse.json({ promo: null }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
