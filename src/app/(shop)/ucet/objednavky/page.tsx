import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CUSTOMER_COOKIE_NAME, getCustomerIdFromCookie } from '@/lib/customerAuth';
import { OrderHistory } from '@/components/shop/OrderHistory';

export const dynamic = 'force-dynamic';

export default async function OrderHistoryPage() {
  const customerId = getCustomerIdFromCookie(cookies().get(CUSTOMER_COOKIE_NAME)?.value);
  if (!customerId) redirect('/ucet');

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      },
    },
  });
  if (!customer) redirect('/ucet');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <OrderHistory customerEmail={customer.email} orders={customer.orders} />
    </div>
  );
}
