import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendReviewInviteEmail } from '@/lib/email';

export async function createAndSendReviewInvite(params: {
  email: string;
  customerName: string;
  orderId?: string;
  customRequestId?: string;
}): Promise<boolean> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.reviewInvite.create({
    data: {
      token,
      email: params.email,
      orderId: params.orderId,
      customRequestId: params.customRequestId,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navazano.cz';
  const reviewUrl = `${baseUrl}/recenze/napsat?token=${token}`;
  return sendReviewInviteEmail(params.email, params.customerName, reviewUrl);
}
