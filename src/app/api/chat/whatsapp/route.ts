import { NextRequest, NextResponse } from 'next/server';
import {
  addMessage,
  getConversationByCode,
  getConversationByWaId,
  latestVisitorConversation,
} from '@/lib/chat/store';
import { noticeToOwner, ownerNumber, verifyMetaSignature } from '@/lib/chat/whatsapp';

export const dynamic = 'force-dynamic';

// Meta calls GET once when the webhook is set up: echo the challenge if the verify token matches.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ok = p.get('hub.mode') === 'subscribe' && !!process.env.WHATSAPP_VERIFY_TOKEN && p.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN;
  return ok ? new NextResponse(p.get('hub.challenge') ?? '', { status: 200 }) : new NextResponse('forbidden', { status: 403 });
}

type WaMessage = { from?: string; type?: string; text?: { body?: string }; context?: { id?: string } };

// Meta calls POST for every incoming WhatsApp message. Messages from the owner's number are replies
// to website chats: a swipe-reply finds the chat by the quoted message, "#K7Q2 …" by its code,
// otherwise the reply goes to the chat where a visitor wrote most recently (last 3 hours).
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyMetaSignature(raw, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 });
  }
  let payload: { entry?: { changes?: { value?: { messages?: WaMessage[] } }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }
  const owner = ownerNumber();
  const messages = (payload.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));

  for (const m of messages) {
    if ((m.from ?? '').replace(/\D/g, '') !== owner) continue; // only the owner's replies go to the website
    if (m.type !== 'text' || !m.text?.body) {
      await noticeToOwner('⚠️ Do chatu na webu umím poslat jen text (ne fotky ani hlasové zprávy).');
      continue;
    }
    let text = m.text.body.trim();
    let conv = m.context?.id ? await getConversationByWaId(m.context.id) : null;
    const codeMatch = /^#([A-Z2-9]{4})\b[\s:,-]*/i.exec(text);
    if (!conv && codeMatch) {
      conv = await getConversationByCode(codeMatch[1]);
      if (conv) text = text.slice(codeMatch[0].length).trim();
    }
    let guessed = false;
    if (!conv) {
      conv = await latestVisitorConversation(180);
      guessed = !!conv;
    }
    if (!conv || !text) {
      await noticeToOwner('⚠️ Nevím, kterému zákazníkovi to patří. Odpovězte přetažením jeho zprávy (Odpovědět), nebo začněte zprávu kódem, např. #K7Q2.');
      continue;
    }
    await addMessage(conv.id, 'owner', text.slice(0, 2000));
    if (guessed) await noticeToOwner(`✓ Odesláno do chatu #${conv.code}`);
  }
  return NextResponse.json({ ok: true });
}
