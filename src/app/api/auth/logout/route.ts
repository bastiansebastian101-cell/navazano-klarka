import { NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_NAME } from '@/lib/customerAuth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(CUSTOMER_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}
