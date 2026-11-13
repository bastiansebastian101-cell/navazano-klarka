import { NextRequest, NextResponse } from 'next/server';
import { syncGopayPayment } from '@/lib/gopay';
import { sendOrderEmails } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

// GoPay server-to-server notification: GET /api/payments/gopay/notify?id=<paymentId>
// Fires even if the customer closes the browser before returning. We never trust
// the id alone — syncGopayPayment asks GoPay for the real state.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') ?? '';
  try {
    const result = await syncGopayPayment(id);
    if (result?.justPaid) await sendOrderEmails(result.orderId);
    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('GoPay notify error:', err);
    return new NextResponse('ERROR', { status: 500 }); // GoPay retries later
  }
}
