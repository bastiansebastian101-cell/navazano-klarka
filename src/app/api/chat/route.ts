import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit, getIp } from '@/lib/rateLimit';
import { SELLER } from '@/lib/seller';
import {
  addMessage,
  countVisitorMessages,
  createConversation,
  getConversation,
  messagesAfter,
  previousVisitorMessageAt,
  setMessageWaId,
  type ChatLang,
} from '@/lib/chat/store';
import { isWhatsAppEnabled, sendToOwner } from '@/lib/chat/whatsapp';

export const dynamic = 'force-dynamic';

const BOT = {
  cs: {
    offlineReply:
      "Děkujeme za zprávu! 🌸 Nejrychleji vám odpovíme na WhatsAppu: klepněte na zelené tlačítko níže. Nebo nám sem napište svůj telefon či e-mail a Klára se vám ozve co nejdříve.",
    firstReply:
      'Děkujeme za zprávu! 🌸 Klára vám odpoví přímo tady v chatu, obvykle během pár minut. Pokud budete muset odejít, nechte nám tu telefon nebo e-mail, nebo nám napište na WhatsApp (zelené tlačítko).',
  },
  en: {
    offlineReply:
      "Thanks for your message! 🌸 The fastest way to get an answer is WhatsApp: tap the green button below. Or write your phone number or e-mail here and Klára will contact you as soon as possible.",
    firstReply:
      "Thanks for your message! 🌸 Klára will reply right here in this chat, usually within a few minutes. If you need to leave, leave your phone or e-mail here, or message us on WhatsApp (green button).",
  },
};

const isId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{20,40}$/.test(v);

async function emailOwner(subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'Navázáno by Klára <objednavky@navazano.cz>',
      to: SELLER.email,
      subject,
      text,
    });
  } catch (err) {
    console.error('chat email failed', err);
  }
}

// GET /api/chat?id=…&after=… — new messages for the visitor's chat (the widget polls this).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const after = Number(req.nextUrl.searchParams.get('after') ?? 0) || 0;
  if (!isId(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const conv = await getConversation(id);
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const messages = await messagesAfter(id, after);
  return NextResponse.json({ messages }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/chat { action: 'start', lang } → new conversation
// POST /api/chat { action: 'send', id, text } → visitor message, forwarded to the owner's WhatsApp
export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const body = await req.json().catch(() => ({}));

  if (body.action === 'start') {
    if (!checkRateLimit(`chat-start:${ip}`, 10, 60 * 60 * 1000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });
    const lang: ChatLang = body.lang === 'en' ? 'en' : 'cs';
    const conv = await createConversation(lang);
    return NextResponse.json({ id: conv.id, code: conv.code });
  }

  if (body.action === 'send') {
    if (!checkRateLimit(`chat-send:${ip}`, 40, 10 * 60 * 1000)) return NextResponse.json({ error: 'too_many' }, { status: 429 });
    if (!isId(body.id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 1000) : '';
    if (!text) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    const conv = await getConversation(body.id);
    if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const msgId = await addMessage(conv.id, 'visitor', text);
    const isFirst = (await countVisitorMessages(conv.id)) === 1;
    const label = `Web #${conv.code} (${conv.lang === 'en' ? 'EN 🇬🇧' : 'CZ 🇨🇿'})`;

    let delivered = false;
    if (isWhatsAppEnabled()) {
      const hint = isFirst ? `↩️ Odpovězte přetažením zprávy doprava (Odpovědět), nebo začněte zprávu #${conv.code}` : '';
      const sent = await sendToOwner(label, text, hint);
      if (sent.ok) {
        await setMessageWaId(msgId, sent.waId);
        delivered = true;
      }
    }
    // E-mail alert with a link to the admin inbox: for the first message of a chat, and again only
    // if the customer writes after a 10-minute pause (so a conversation doesn't send one e-mail per line).
    if (!delivered) {
      const prev = isFirst ? null : await previousVisitorMessageAt(conv.id, msgId);
      if (isFirst || !prev || Date.now() - new Date(prev).getTime() > 10 * 60 * 1000) {
        const base = process.env.NEXT_PUBLIC_APP_URL || 'https://navazano.cz';
        await emailOwner(
          `💬 Nová zpráva v chatu na webu (#${conv.code})`,
          `${label}\n\n${text}\n\nOdpovězte tady: ${base}/admin/chat?c=${conv.code}\n(Odpověď se zákazníkovi zobrazí přímo v chatu na webu.)`
        );
      }
    }
    // Replies from the admin inbox (or WhatsApp, when connected) appear right in the customer's chat.
    if (isFirst) await addMessage(conv.id, 'bot', BOT[conv.lang].firstReply);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'invalid' }, { status: 400 });
}
