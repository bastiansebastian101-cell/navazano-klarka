import crypto from 'crypto';

export const CUSTOMER_COOKIE_NAME = 'customer_session';

function sign(customerId: string): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return crypto.createHmac('sha256', secret + '_navazano_customer_salt').update(customerId).digest('hex');
}

export function createCustomerSessionCookie(customerId: string): string | null {
  const signature = sign(customerId);
  if (!signature) return null;
  return `${customerId}.${signature}`;
}

export function getCustomerIdFromCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const [customerId, signature] = cookieValue.split('.');
  if (!customerId || !signature) return null;
  const expected = sign(customerId);
  if (!expected || signature !== expected) return null;
  return customerId;
}
