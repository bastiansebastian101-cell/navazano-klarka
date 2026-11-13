import crypto from 'crypto';
import { prisma } from './db';

// Login links put into the order confirmation email. Unlike the 15-minute
// single-use links from /ucet, these stay valid for 30 days and can be clicked
// more than once — mail scanners (Outlook Safe Links, Gmail) often open links
// before the customer does, which would burn a single-use token. The "o_"
// prefix marks them so /api/auth/verify knows not to consume them.
export const ORDER_LINK_PREFIX = 'o_';
const VALID_DAYS = 30;

export function isReusableOrderToken(token: string): boolean {
  return token.startsWith(ORDER_LINK_PREFIX);
}

/** Returns a one-click login URL to the customer's order history, or null if it couldn't be created. */
export async function createOrderLoginUrl(email: string): Promise<string | null> {
  try {
    const token = ORDER_LINK_PREFIX + crypto.randomBytes(32).toString('hex');
    await prisma.loginToken.create({
      data: { token, email, expiresAt: new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000) },
    });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navazano.cz';
    return `${baseUrl}/api/auth/verify?token=${token}`;
  } catch (err) {
    console.error('createOrderLoginUrl failed:', err);
    return null; // the order itself must never fail because of this
  }
}
