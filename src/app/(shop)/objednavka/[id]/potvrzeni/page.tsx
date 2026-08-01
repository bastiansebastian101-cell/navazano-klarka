import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { OrderConfirmation } from '@/components/shop/OrderConfirmation';
import { generatePaymentQrDataUrl, formatIbanForDisplay } from '@/lib/payment';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  const qrDataUrl = await generatePaymentQrDataUrl({
    amountCzk: order.totalCzk,
    variableSymbol: order.orderNumber,
    message: `Objednavka ${order.orderNumber}`,
  });

  const iban = process.env.BANK_IBAN ? formatIbanForDisplay(process.env.BANK_IBAN) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <OrderConfirmation order={order} iban={iban} qrDataUrl={qrDataUrl} />
    </div>
  );
}
