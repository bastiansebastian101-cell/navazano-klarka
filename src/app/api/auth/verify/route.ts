import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CUSTOMER_COOKIE_NAME, createCustomerSessionCookie } from '@/lib/customerAuth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const baseUrl = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/ucet?error=invalid`);
  }

  const loginToken = await prisma.loginToken.findUnique({ where: { token } });
  if (!loginToken || loginToken.usedAt || loginToken.expiresAt < new Date()) {
    return NextResponse.redirect(`${baseUrl}/ucet?error=expired`);
  }

  const customer = await prisma.customer.findUnique({ where: { email: loginToken.email } });
  if (!customer) {
    return NextResponse.redirect(`${baseUrl}/ucet?error=invalid`);
  }

  await prisma.loginToken.update({ where: { id: loginToken.id }, data: { usedAt: new Date() } });

  const cookieValue = createCustomerSessionCookie(customer.id);
  if (!cookieValue) {
    return NextResponse.redirect(`${baseUrl}/ucet?error=server`);
  }

  const res = NextResponse.redirect(`${baseUrl}/ucet/objednavky`);
  res.cookies.set(CUSTOMER_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
