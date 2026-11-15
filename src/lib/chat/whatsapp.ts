import { createHmac, timingSafeEqual } from 'crypto';

// WhatsApp Business Platform (Meta Cloud API). Website chat messages are sent from the shop's
// WhatsApp Business number to the owner's own WhatsApp; the owner's replies come back via the webhook.
//
// Vercel env:
//   WHATSAPP_TOKEN            permanent access token (Meta Business → System users)
//   WHATSAPP_PHONE_NUMBER_ID  ID of the business number that sends (WhatsApp Manager → API setup)
//   WHATSAPP_OWNER_NUMBER     owner's personal WhatsApp, digits only, e.g. 420728415630
//   WHATSAPP_VERIFY_TOKEN     any secret text; the same text goes into the Meta webhook settings
//   WHATSAPP_APP_SECRET       Meta app secret, used to check that webhook calls really come from Meta
//   WHATSAPP_TEMPLATE         optional: approved template used when the owner hasn't written to the business
//                             number in the last 24 h (WhatsApp rule). Body must have 2 variables:
//                             {{1}} = chat label, {{2}} = message text.
//   WHATSAPP_TEMPLATE_LANG    template language code, default "cs"
// When the first three are not set, chat messages are e-mailed instead (replies then can't come back).

const API = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v21.0'}`;

export const ownerNumber = () => (process.env.WHATSAPP_OWNER_NUMBER ?? '').replace(/\D/g, '');

export function isWhatsAppEnabled() {
  return !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID && ownerNumber().length >= 9;
}

type SendResult = { ok: true; waId: string } | { ok: false; code?: number; error: string };

async function post(body: unknown): Promise<SendResult> {
  try {
    const res = await fetch(`${API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const waId = data?.messages?.[0]?.id;
    if (res.ok && typeof waId === 'string') return { ok: true, waId };
    return { ok: false, code: data?.error?.code, error: data?.error?.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Template variables may not contain new lines, tabs or more than 4 spaces in a row. */
const flat = (s: string) => s.replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim().slice(0, 900);

/**
 * Sends a message to the owner. Free-form text works only inside WhatsApp's 24-hour window
 * (the owner wrote to the business number in the last 24 h); otherwise the approved template is used.
 */
export async function sendToOwner(label: string, text: string, hint = ''): Promise<SendResult> {
  const to = ownerNumber();
  const first = await post({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { preview_url: false, body: `💬 ${label}\n${text}${hint ? `\n\n${hint}` : ''}`.slice(0, 4000) },
  });
  if (first.ok) return first;
  const template = (process.env.WHATSAPP_TEMPLATE ?? '').trim();
  // 131047 = outside the 24-hour window ("re-engagement message"); 131026/470 = similar delivery limits
  if (template && (first.code === 131047 || first.code === 470 || first.code === 131026)) {
    return post({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: (process.env.WHATSAPP_TEMPLATE_LANG ?? 'cs').trim() },
        components: [{ type: 'body', parameters: [{ type: 'text', text: flat(label) }, { type: 'text', text: flat(text) }] }],
      },
    });
  }
  console.error('whatsapp send failed', first);
  return first;
}

/** Short notice to the owner (e.g. "sent to #K7Q2"). Best effort. */
export async function noticeToOwner(text: string) {
  if (!isWhatsAppEnabled()) return;
  await post({ messaging_product: 'whatsapp', to: ownerNumber(), type: 'text', text: { preview_url: false, body: text } });
}

/** Checks the X-Hub-Signature-256 header Meta sends with every webhook call. */
export function verifyMetaSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(header ?? '');
  return a.length === b.length && timingSafeEqual(a, b);
}
