export const DELIVERY_WINDOWS = ['9-12', '12-15', '15-18'] as const;
export type DeliveryWindow = (typeof DELIVERY_WINDOWS)[number];

// Orders placed before this hour (Czech time) can still get next-day delivery;
// after it, the earliest slot pushes out one more day.
export const ORDER_CUTOFF_HOUR = 15;

// The shop works on Czech time, whatever timezone the server (UTC on Vercel)
// or the visitor's device is in.
export const SHOP_TIME_ZONE = 'Europe/Prague';

/** Calendar date and hour in Czech time for a given instant. */
export function pragueParts(now: Date = new Date()): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month') - 1, day: get('day'), hour: get('hour') };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Earliest date a delivery can be scheduled for, given when the order is placed.
// "Today" and the cutoff hour are both taken in Czech time.
// prepDays: preparation time of the slowest item in the order (pre-order
// products such as Christmas bouquets); 0 = normal next-day delivery.
export function earliestDeliveryDate(now: Date = new Date(), prepDays: number = 0): Date {
  const { year, month, day, hour } = pragueParts(now);
  const daysAhead = Math.max(1, prepDays) + (hour < ORDER_CUTOFF_HOUR ? 0 : 1);
  return new Date(year, month, day + daysAhead);
}

// Re-validated server-side on every order — never trust a client-picked date.
export function isDeliveryDateValid(deliveryDate: Date, now: Date = new Date(), prepDays: number = 0): boolean {
  return startOfDay(deliveryDate).getTime() >= earliestDeliveryDate(now, prepDays).getTime();
}

export function isDeliveryWindowValid(window: string): window is DeliveryWindow {
  return (DELIVERY_WINDOWS as readonly string[]).includes(window);
}
