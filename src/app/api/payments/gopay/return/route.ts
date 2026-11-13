import { NextRequest, NextResponse } from 'next/server';
import { syncPayment } from '@/lib/payments';
import { sendOrderEmails } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

// GoPay sends the customer back here: /api/payments/gopay/return?id=<paymentId>
export async function GET(request: NextRequest) {
  const base = request.nextUrl.origin;
  try {
    const result = await syncPayment('gopay', request.nextUrl.searchParams.get('id') ?? '');
    if (!result) return NextResponse.redirect(`${base}/`);
    if (result.justPaid) await sendOrderEmails(result.orderId);
    return NextResponse.redirect(`${base}/objednavka/${result.orderId}/potvrzeni`);
  } catch (err) {
    console.error('GoPay return error:', err);
    return NextResponse.redirect(`${base}/`);
  }
}
