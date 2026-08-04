import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/requireAdmin';
import { sendCustomRequestInvoiceEmail } from '@/lib/email';

// Offset so a custom-request invoice's variable symbol never collides with a
// regular Order's variable symbol (Order.orderNumber) — also makes it
// immediately recognizable as a custom-invoice payment in a bank statement.
const INVOICE_VS_OFFSET = 800000;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const bouquetName = typeof body.bouquetName === 'string' ? body.bouquetName.trim() : '';
  const priceCzk = Number.isInteger(body.priceCzk) && body.priceCzk > 0 ? body.priceCzk : null;

  if (!bouquetName || !priceCzk) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const customRequest = await prisma.customRequest.update({
    where: { id: params.id },
    data: { bouquetName, priceCzk },
  });

  const sent = await sendCustomRequestInvoiceEmail({
    name: customRequest.name,
    email: customRequest.email,
    bouquetName,
    priceCzk,
    variableSymbol: INVOICE_VS_OFFSET + customRequest.invoiceNumber,
  });

  if (sent) {
    await prisma.customRequest.update({
      where: { id: params.id },
      data: { invoiceSentAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, sent });
}
