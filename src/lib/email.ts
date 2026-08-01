import { Resend } from 'resend';
import { formatCzk } from './format';
import { DELIVERY_WINDOW_LABELS_CS } from './delivery-labels';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// TODO: switch to a domain-verified sender (e.g. objednavky@navazano-klarka.cz)
// once a real domain is set up on Resend for this project — resend.dev works
// without verification but is only meant for testing.
const FROM = 'Navázáno by Klára <onboarding@resend.dev>';

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryDate: Date;
  deliveryWindow: string;
  paymentMethod: string;
  totalCzk: number;
  items: { nameCs: string; quantity: number; priceCzk: number }[];
}

function itemsTable(items: OrderEmailData['items']): string {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#111;">${i.nameCs} × ${i.quantity}</td><td style="padding:6px 0;text-align:right;color:#111;">${formatCzk(i.priceCzk * i.quantity)}</td></tr>`
    )
    .join('');
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const windowLabel = DELIVERY_WINDOW_LABELS_CS[data.deliveryWindow] ?? data.deliveryWindow;
  const dateLabel = data.deliveryDate.toLocaleDateString('cs-CZ');
  const paymentLabel = data.paymentMethod === 'bank_transfer' ? 'Bankovní převod' : 'Platba při doručení';

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Potvrzení objednávky #${data.orderId.slice(-8)} — Navázáno by Klára`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:4px;">Děkujeme za objednávku!</h2>
        <p style="color:#777;font-size:13px;margin-bottom:24px;">Objednávka #${data.orderId.slice(-8)}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemsTable(data.items)}</table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
          <tr><td style="padding:8px 0;font-weight:600;color:#111;">Celkem</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#B8567A;">${formatCzk(data.totalCzk)}</td></tr>
        </table>
        <div style="margin-top:20px;padding:16px;background:#FBEEF1;border-radius:8px;">
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Doručení:</strong> ${dateLabel}, ${windowLabel}</p>
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Adresa:</strong> ${data.deliveryAddress}</p>
          <p style="margin:0;color:#111;font-size:14px;"><strong>Platba:</strong> ${paymentLabel}</p>
        </div>
        <p style="color:#999;font-size:12px;margin-top:32px;">Navázáno by Klára</p>
      </div>
    `,
  });

  if (error) {
    console.error('sendOrderConfirmationEmail failed:', data.customerEmail, error);
    return false;
  }
  return true;
}

export async function sendNewOrderAlertEmail(data: OrderEmailData): Promise<boolean> {
  const resend = getResend();
  const notifyEmails = process.env.KLARKA_NOTIFY_EMAIL?.split(',').map((e) => e.trim()).filter(Boolean);
  if (!resend || !notifyEmails?.length) return false;

  const windowLabel = DELIVERY_WINDOW_LABELS_CS[data.deliveryWindow] ?? data.deliveryWindow;
  const dateLabel = data.deliveryDate.toLocaleDateString('cs-CZ');
  const paymentLabel = data.paymentMethod === 'bank_transfer' ? 'Bankovní převod' : 'Platba při doručení';

  const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:4px;">Nová objednávka</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#555;width:140px;">Zákazník</td><td style="padding:8px 0;font-weight:600;color:#111;">${data.customerName}</td></tr>
          <tr><td style="padding:8px 0;color:#555;">E-mail</td><td style="padding:8px 0;"><a href="mailto:${data.customerEmail}" style="color:#B8567A;">${data.customerEmail}</a></td></tr>
          <tr><td style="padding:8px 0;color:#555;">Doručení</td><td style="padding:8px 0;color:#111;">${dateLabel}, ${windowLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#555;">Adresa</td><td style="padding:8px 0;color:#111;">${data.deliveryAddress}</td></tr>
          <tr><td style="padding:8px 0;color:#555;">Platba</td><td style="padding:8px 0;color:#111;">${paymentLabel}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">${itemsTable(data.items)}</table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;font-weight:600;color:#111;">Celkem</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#B8567A;">${formatCzk(data.totalCzk)}</td></tr>
        </table>
      </div>
    `;
  const subject = `Nová objednávka #${data.orderId.slice(-8)} od ${data.customerName}`;

  // Sent individually per recipient — Resend rejects the whole call if any
  // one address isn't allowed (e.g. sandbox mode only allows the account
  // owner's own address), which would otherwise block delivery to every
  // recipient just because one of them isn't cleared yet.
  const results = await Promise.all(
    notifyEmails.map((to) => resend.emails.send({ from: FROM, to, subject, html }))
  );

  let anySucceeded = false;
  results.forEach(({ error }, i) => {
    if (error) {
      console.error('sendNewOrderAlertEmail failed:', notifyEmails[i], error);
    } else {
      anySucceeded = true;
    }
  });
  return anySucceeded;
}
