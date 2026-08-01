import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { OrderConfirmation } from '@/components/shop/OrderConfirmation';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <OrderConfirmation order={order} bankAccountNumber={process.env.BANK_ACCOUNT_NUMBER ?? null} />
    </div>
  );
}
