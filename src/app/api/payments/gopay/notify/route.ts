import { NextRequest, NextResponse } from 'next/server';
import { syncPayment } from '@/lib/payments';
import { sendOrderEmails } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

// GoPay server-to-server notification: GET /api/payments/gopay/notify?id=<paymentId>
// Fires even if the customer closes the browser. The state is re-checked with GoPay.
export async function GET(request: NextRequest) {
  try {
    const result = await syncPayment('gopay', request.nextUrl.searchParams.get('id') ?? '');
    if (result?.justPaid) await sendOrderEmails(result.orderId);
    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('GoPay notify error:', err);
    return new NextResponse('ERROR', { status: 500 }); // GoPay retries later
  }
}
