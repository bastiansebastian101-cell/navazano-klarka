import { NextRequest, NextResponse } from 'next/server';
import { syncPayment } from '@/lib/payments';
import { sendOrderEmails } from '@/lib/orderEmails';

export const dynamic = 'force-dynamic';

// Comgate background notification ("Result URL" in the Comgate client portal).
// Sent as JSON (REST API) or form data (HTTP POST API); we only take the transId
// from it and ask Comgate for the real state — the notification itself is not trusted.
export async function POST(request: NextRequest) {
  let transId = '';
  try {
    const type = request.headers.get('content-type') ?? '';
    if (type.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      transId = typeof body.transId === 'string' ? body.transId : '';
    } else {
      const form = await request.formData().catch(() => null);
      transId = String(form?.get('transId') ?? '');
    }
  } catch {
    // fall through with empty transId
  }

  try {
    const result = await syncPayment('comgate', transId);
    if (result?.justPaid) await sendOrderEmails(result.orderId);
    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('Comgate notify error:', err);
    return new NextResponse('ERROR', { status: 500 }); // Comgate retries later
  }
}
