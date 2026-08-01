export const DELIVERY_WINDOWS = ['9-12', '12-15', '15-18'] as const;
export type DeliveryWindow = (typeof DELIVERY_WINDOWS)[number];

// Orders placed before this hour (local time) can still get next-day delivery;
// after it, the earliest slot pushes out one more day.
export const ORDER_CUTOFF_HOUR = 15;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Earliest date a delivery can be scheduled for, given when the order is placed.
export function earliestDeliveryDate(now: Date = new Date()): Date {
  const daysAhead = now.getHours() < ORDER_CUTOFF_HOUR ? 1 : 2;
  const earliest = startOfDay(now);
  earliest.setDate(earliest.getDate() + daysAhead);
  return earliest;
}

// Re-validated server-side on every order — never trust a client-picked date.
export function isDeliveryDateValid(deliveryDate: Date, now: Date = new Date()): boolean {
  return startOfDay(deliveryDate).getTime() >= earliestDeliveryDate(now).getTime();
}

export function isDeliveryWindowValid(window: string): window is DeliveryWindow {
  return (DELIVERY_WINDOWS as readonly string[]).includes(window);
}
