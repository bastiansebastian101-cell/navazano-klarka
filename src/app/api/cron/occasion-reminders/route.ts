import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOccasionReminderEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Sent this many days before the anniversary of the delivery date, so there's
// still time to place a new order for delivery by the actual occasion.
const REMINDER_LEAD_DAYS = 5;

function requireAuth(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// True if `today` falls in the window [anniversary - leadDays, anniversary] for
// the given source date's month/day in the current year. A window (not an
// exact-day match) means a missed cron run doesn't silently skip the reminder
// for the whole year.
function isInReminderWindow(sourceDate: Date, today: Date): boolean {
  const anniversary = startOfDay(new Date(today.getFullYear(), sourceDate.getMonth(), sourceDate.getDate()));
  const windowStart = new Date(anniversary);
  windowStart.setDate(windowStart.getDate() - REMINDER_LEAD_DAYS);
  return today.getTime() >= windowStart.getTime() && today.getTime() <= anniversary.getTime();
}

export async function GET(request: NextRequest) {
  if (!requireAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const today = startOfDay(now);
  const currentYear = now.getFullYear();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navazano.cz';
  const buyAgainUrl = `${baseUrl}/katalog`;

  let reminded = 0;

  const orders = await prisma.order.findMany({
    where: { occasionReason: { not: null } },
  });
  for (const order of orders) {
    if (!order.occasionReason) continue;
    if (order.occasionReminderSentYear === currentYear) continue;
    if (order.deliveryDate.getFullYear() >= currentYear) continue; // occasion must be from a prior year
    if (!isInReminderWindow(order.deliveryDate, today)) continue;

    const sent = await sendOccasionReminderEmail(order.email, order.customerName, order.occasionReason, buyAgainUrl);
    if (sent) {
      await prisma.order.update({ where: { id: order.id }, data: { occasionReminderSentYear: currentYear } });
      reminded++;
    }
  }

  const customRequests = await prisma.customRequest.findMany({
    where: { occasionReason: { not: null } },
  });
  for (const cr of customRequests) {
    if (!cr.occasionReason || !cr.deliveryDate) continue;
    if (cr.occasionReminderSentYear === currentYear) continue;
    if (cr.deliveryDate.getFullYear() >= currentYear) continue;
    if (!isInReminderWindow(cr.deliveryDate, today)) continue;

    const sent = await sendOccasionReminderEmail(cr.email, cr.name, cr.occasionReason, buyAgainUrl);
    if (sent) {
      await prisma.customRequest.update({ where: { id: cr.id }, data: { occasionReminderSentYear: currentYear } });
      reminded++;
    }
  }

  return NextResponse.json({ reminded });
}
