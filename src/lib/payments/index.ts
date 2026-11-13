import { comgate } from './comgate';
import { gopay } from './gopay';
import { recordPayment, orderIdForPayment, updatePaymentState, markOrderPaidOnce, isOrderPaid } from './store';
import type { OrderForPayment, PaymentProvider } from './types';

export { isOrderPaid, paidOrderIds } from './store';
export type { OrderForPayment } from './types';

/** Stored Order.paymentMethod value for card / Google Pay / Apple Pay / bank-button payments. */
export const ONLINE_METHOD = 'card';

const PROVIDERS: Record<PaymentProvider['name'], PaymentProvider> = { comgate, gopay };

/**
 * Which gateway takes new payments: whichever has its keys set in Vercel.
 * Comgate wins if both are configured. Switching = change the keys + redeploy.
 */
export function activeProvider(): PaymentProvider | null {
  if (comgate.isConfigured()) return comgate;
  if (gopay.isConfigured()) return gopay;
  return null;
}

export function isOnlinePaymentEnabled(): boolean {
  return activeProvider() !== null;
}

/** Creates a payment at the active gateway and returns the URL to send the customer to. */
export async function createOnlinePayment(order: OrderForPayment, appBaseUrl: string): Promise<string> {
  const provider = activeProvider();
  if (!provider) throw new Error('No payment gateway configured');
  const { paymentId, redirectUrl, state } = await provider.create(order, appBaseUrl);
  await recordPayment(provider.name, paymentId, order.id, state);
  return redirectUrl;
}

/**
 * Re-checks a payment with the gateway itself, stores the state and reports whether
 * this call is the one that just marked the order paid (so emails go out exactly once).
 * Works for payments of either gateway, even after switching.
 */
export async function syncPayment(
  providerName: PaymentProvider['name'],
  paymentId: string
): Promise<{ orderId: string; paid: boolean; justPaid: boolean } | null> {
  const provider = PROVIDERS[providerName];
  if (!provider?.isConfigured() || !paymentId || paymentId.length > 64) return null;

  const orderId = await orderIdForPayment(providerName, paymentId);
  if (!orderId) return null; // not one of ours

  const { raw, state } = await provider.getState(paymentId);
  await updatePaymentState(providerName, paymentId, raw);

  if (state !== 'PAID') return { orderId, paid: await isOrderPaid(orderId), justPaid: false };
  const justPaid = await markOrderPaidOnce(orderId, providerName, paymentId);
  return { orderId, paid: true, justPaid };
}
