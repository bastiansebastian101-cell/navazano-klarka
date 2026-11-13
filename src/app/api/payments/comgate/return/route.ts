import { NextRequest, NextResponse } from 'next/server';
import { syncPayment } from '@/lib/payments';
import { sendOrderEmails } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

// Comgate sends the customer back here: /api/payments/comgate/return?id=<transId>
export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;
  try {
    const result = await syncPayment('comgate', request.nextUrl.searchParams.get('id') ?? '');
    if (!result) return NextResponse.redirect(`${base}/`);
    if (result.justPaid) await sendOrderEmails(result.orderId);
    return NextResponse.redirect(`${base}/objednavka/${result.orderId}/potvrzeni`);
  } catch (err) {
    console.error('Comgate return error:', err);
    return NextResponse.redirect(`${base}/`);
  }
}
