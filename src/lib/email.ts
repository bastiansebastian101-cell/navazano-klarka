import { Resend } from 'resend';
import { formatCzk } from './format';
import { DELIVERY_WINDOW_LABELS_CS } from './delivery-labels';
import { generatePaymentQrAsset, formatIbanForDisplay } from './payment';

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = 'Navázáno by Klára <objednavky@navazano.cz>';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface OrderEmailData {
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryDate: Date;
  deliveryWindow: string;
  paymentMethod: string;
  subtotalCzk?: number;
  discountCzk?: number;
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

  const bankDetails =
    data.paymentMethod === 'bank_transfer' && process.env.BANK_IBAN
      ? `
        <div style="margin-top:12px;padding:16px;background:#fff;border:1px solid #eee;border-radius:8px;">
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Číslo účtu (IBAN):</strong> ${process.env.BANK_IBAN}</p>
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Variabilní symbol:</strong> ${data.orderNumber}</p>
          <p style="margin:0;color:#111;font-size:14px;"><strong>Částka:</strong> ${formatCzk(data.totalCzk)}</p>
        </div>
      `
      : '';

  const hasDiscount = !!data.discountCzk && data.discountCzk > 0;
  const totalsRows = hasDiscount
    ? `
        <tr><td style="padding:8px 0;color:#555;">Mezisoučet</td><td style="padding:8px 0;text-align:right;color:#111;">${formatCzk(data.subtotalCzk ?? data.totalCzk + data.discountCzk!)}</td></tr>
        <tr><td style="padding:8px 0;color:#555;">Sleva</td><td style="padding:8px 0;text-align:right;color:#4FA87C;">−${formatCzk(data.discountCzk!)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:600;color:#111;">Celkem</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#B8567A;">${formatCzk(data.totalCzk)}</td></tr>
      `
    : `<tr><td style="padding:8px 0;font-weight:600;color:#111;">Celkem</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#B8567A;">${formatCzk(data.totalCzk)}</td></tr>`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `Potvrzení objednávky #${data.orderNumber} — Navázáno by Klára`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:4px;">Děkujeme za objednávku!</h2>
        <p style="color:#777;font-size:13px;margin-bottom:24px;">Objednávka #${data.orderNumber}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemsTable(data.items)}</table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;border-top:1px solid #eee;padding-top:8px;">
          ${totalsRows}
        </table>
        <div style="margin-top:20px;padding:16px;background:#FBEEF1;border-radius:8px;">
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Doručení:</strong> ${dateLabel}, ${windowLabel}</p>
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Adresa:</strong> ${data.deliveryAddress}</p>
          <p style="margin:0;color:#111;font-size:14px;"><strong>Platba:</strong> ${paymentLabel}</p>
          ${bankDetails}
        </div>
        <p style="margin-top:20px;color:#555;font-size:13px;">Uložili jsme vaše údaje, abyste mohli sledovat historii objednávek. Přihlaste se pomocí e-mailu <strong>${data.customerEmail}</strong> na <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://navazano.cz'}/ucet" style="color:#B8567A;">navazano.cz/ucet</a>.</p>
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
  const subject = `Nová objednávka #${data.orderNumber} od ${data.customerName}`;

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

interface CustomRequestEmailData {
  name: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  deliveryDate: Date;
  message: string;
  imageUrl?: string | null;
}

export async function sendCustomRequestEmail(data: CustomRequestEmailData): Promise<boolean> {
  const resend = getResend();
  const notifyEmails = process.env.KLARKA_NOTIFY_EMAIL?.split(',').map((e) => e.trim()).filter(Boolean);
  if (!resend || !notifyEmails?.length) return false;

  const name = escapeHtml(data.name);
  const phone = escapeHtml(data.phone);
  const deliveryAddress = escapeHtml(data.deliveryAddress);
  const message = escapeHtml(data.message);
  const deliveryDateLabel = data.deliveryDate.toLocaleDateString('cs-CZ');

  const imageBlock = data.imageUrl
    ? `<div style="margin-top:16px;"><img src="${data.imageUrl}" alt="Inspirace" style="max-width:100%;border-radius:8px;" /></div>`
    : '';

  const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:4px;">Nové přání na míru</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
          <tr><td style="padding:8px 0;color:#555;width:100px;">Jméno</td><td style="padding:8px 0;font-weight:600;color:#111;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#555;">E-mail</td><td style="padding:8px 0;"><a href="mailto:${data.email}" style="color:#B8567A;">${data.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#555;">Telefon</td><td style="padding:8px 0;"><a href="tel:${phone}" style="color:#B8567A;">${phone}</a></td></tr>
          <tr><td style="padding:8px 0;color:#555;">Adresa doručení</td><td style="padding:8px 0;font-weight:600;color:#111;">${deliveryAddress}</td></tr>
          <tr><td style="padding:8px 0;color:#555;">Termín doručení</td><td style="padding:8px 0;font-weight:600;color:#111;">${deliveryDateLabel}</td></tr>
        </table>
        <div style="margin-top:16px;padding:16px;background:#FBEEF1;border-radius:8px;">
          <p style="margin:0;color:#111;font-size:14px;white-space:pre-wrap;">${message}</p>
        </div>
        ${imageBlock}
      </div>
    `;
  const subject = `Nové přání na míru od ${data.name}`;

  const results = await Promise.all(
    notifyEmails.map((to) => resend.emails.send({ from: FROM, to, subject, html }))
  );

  let anySucceeded = false;
  results.forEach(({ error }, i) => {
    if (error) {
      console.error('sendCustomRequestEmail failed:', notifyEmails[i], error);
    } else {
      anySucceeded = true;
    }
  });
  return anySucceeded;
}

export async function sendLoginLinkEmail(email: string, loginUrl: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Přihlašovací odkaz — Navázáno by Klára',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:12px;">Přihlášení k vašemu účtu</h2>
        <p style="color:#111;font-size:14px;line-height:1.6;">Klikněte na tlačítko níže pro přihlášení a zobrazení historie vašich objednávek. Odkaz je platný 15 minut.</p>
        <a href="${loginUrl}" style="display:inline-block;margin-top:20px;background:#F582B3;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:999px;">Přihlásit se</a>
        <p style="color:#999;font-size:12px;margin-top:32px;">Pokud jste o přihlášení nežádali, tento e-mail můžete ignorovat.</p>
      </div>
    `,
  });

  if (error) {
    console.error('sendLoginLinkEmail failed:', email, error);
    return false;
  }
  return true;
}

export async function sendCustomRequestInvoiceEmail(data: {
  name: string;
  email: string;
  bouquetName: string;
  priceCzk: number;
  variableSymbol: number;
}): Promise<boolean> {
  const resend = getResend();
  const iban = process.env.BANK_IBAN;
  if (!resend || !iban) return false;

  const qrAsset = await generatePaymentQrAsset({
    amountCzk: data.priceCzk,
    variableSymbol: data.variableSymbol,
    message: `${data.bouquetName} - ${data.name}`,
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: data.email,
    subject: `Platba za kytici „${data.bouquetName}“ — Navázáno by Klára`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:4px;">Vaše kytice na míru je připravena k zaplacení</h2>
        <p style="color:#111;font-size:14px;line-height:1.6;">Ahoj ${data.name}, na základě vašeho přání jsme pro vás připravili kytici <strong>${data.bouquetName}</strong>. Prosíme o úhradu bankovním převodem podle údajů níže, nebo naskenujte QR kód ve své bankovní aplikaci (přiložen také jako příloha e-mailu).</p>
        <div style="margin-top:20px;padding:16px;background:#FBEEF1;border-radius:8px;">
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Kytice:</strong> ${data.bouquetName}</p>
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Částka:</strong> ${formatCzk(data.priceCzk)}</p>
          <p style="margin:0 0 6px;color:#111;font-size:14px;"><strong>Číslo účtu (IBAN):</strong> ${formatIbanForDisplay(iban)}</p>
          <p style="margin:0;color:#111;font-size:14px;"><strong>Variabilní symbol:</strong> ${data.variableSymbol}</p>
        </div>
        ${qrAsset ? `<div style="margin-top:20px;text-align:center;"><img src="${qrAsset.url}" alt="QR platba" width="200" height="200" /></div>` : ''}
        <p style="color:#999;font-size:12px;margin-top:32px;">Navázáno by Klára</p>
      </div>
    `,
    attachments: qrAsset ? [{ filename: 'qr-platba.png', content: qrAsset.buffer }] : undefined,
  });

  if (error) {
    console.error('sendCustomRequestInvoiceEmail failed:', data.email, error);
    return false;
  }
  return true;
}

export async function sendOccasionReminderEmail(
  email: string,
  customerName: string,
  occasionReason: string,
  buyAgainUrl: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const name = escapeHtml(customerName);
  const reason = escapeHtml(occasionReason);

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Před rokem jste udělali radost krásnou kyticí — co letos?',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:8px;">Ahoj ${name},</h2>
        <p style="color:#111;font-size:14px;line-height:1.6;">před rokem jste si u nás objednali nádhernou kytici k příležitosti <strong>${reason}</strong>. Blíží se stejný den — nechcete tentokrát udělat radost znovu?</p>
        <a href="${buyAgainUrl}" style="display:inline-block;margin-top:20px;background:#F582B3;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:999px;">Koupit a udělat radost</a>
        <p style="color:#999;font-size:12px;margin-top:32px;">Navázáno by Klára</p>
      </div>
    `,
  });

  if (error) {
    console.error('sendOccasionReminderEmail failed:', email, error);
    return false;
  }
  return true;
}

export async function sendReviewInviteEmail(email: string, customerName: string, reviewUrl: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  const name = escapeHtml(customerName);

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Jak se vám líbila vaše kytice? — Navázáno by Klára',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="color:#111;margin-bottom:8px;">Děkujeme za objednávku, ${name}!</h2>
        <p style="color:#111;font-size:14px;line-height:1.6;">Doufáme, že máte z kytice radost. Bude nám velkou poctou, když nám o své zkušenosti napíšete pár slov — pomůže nám to i dalším zákazníkům.</p>
        <a href="${reviewUrl}" style="display:inline-block;margin-top:20px;background:#F582B3;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:999px;">Napsat recenzi</a>
        <p style="color:#999;font-size:12px;margin-top:32px;">Navázáno by Klára</p>
      </div>
    `,
  });

  if (error) {
    console.error('sendReviewInviteEmail failed:', email, error);
    return false;
  }
  return true;
}
