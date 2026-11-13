import { prisma } from './db';
import { sendOrderConfirmationEmail, sendNewOrderAlertEmail } from './email';
import { createOrderLoginUrl } from './orderLoginLink';

/** Sends the customer confirmation (with one-click login link) and Klára's new-order alert. */
export async function sendOrderEmails(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) return;

  const emailData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.email,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate,
    deliveryWindow: order.deliveryWindow,
    paymentMethod: order.paymentMethod,
    subtotalCzk: order.totalCzk + order.discountCzk,
    discountCzk: order.discountCzk,
    totalCzk: order.totalCzk,
    items: order.items.map((i) => ({
      nameCs: i.product.nameCs,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      priceCzk: i.priceCzk,
    })),
  };

  // One-click link to the customer's order history, only in the customer's email.
  const loginUrl = await createOrderLoginUrl(order.email);

  await Promise.all([sendOrderConfirmationEmail({ ...emailData, loginUrl }), sendNewOrderAlertEmail(emailData)]);
}

