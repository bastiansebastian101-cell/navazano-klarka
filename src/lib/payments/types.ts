export type OrderForPayment = {
  id: string;
  orderNumber: number;
  customerName: string;
  email: string;
  phone: string;
  totalCzk: number; // haléře
  items: { name: string; quantity: number; priceCzk: number }[];
};

/** Normalised payment state across providers. */
export type PaymentState = 'PAID' | 'PENDING' | 'CANCELLED' | 'OTHER';

export interface PaymentProvider {
  name: 'comgate' | 'gopay';
  isConfigured(): boolean;
  /** Creates the payment and returns the provider id + the URL to send the customer to. */
  create(order: OrderForPayment, appBaseUrl: string): Promise<{ paymentId: string; redirectUrl: string; state: string }>;
  /** Asks the provider for the real state (never trust a callback or query string alone). */
  getState(paymentId: string): Promise<{ raw: string; state: PaymentState }>;
}
