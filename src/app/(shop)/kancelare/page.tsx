import { prisma } from '@/lib/db';
import { OfficeSubscriptionPage } from '@/components/shop/OfficeSubscriptionPage';

export const dynamic = 'force-dynamic';

export default async function KancelarePage() {
  const plans = await prisma.officeSubscriptionPlan.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  });

  return <OfficeSubscriptionPage plans={plans} />;
}
