import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { addMessage, getConversation, markSeen, messagesAfter } from '@/lib/chat/store';

export const dynamic = 'force-dynamic';

const isId = (v: string) => /^[A-Za-z0-9_-]{20,40}$/.test(v);

// Admin: messages of one chat (after a message id); opening it marks the chat as read.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isId(params.id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const conv = await getConversation(params.id);
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const after = Number(request.nextUrl.searchParams.get('after') ?? 0) || 0;
  const messages = await messagesAfter(conv.id, after);
  await markSeen(conv.id);
  return NextResponse.json({ conversation: { code: conv.code, lang: conv.lang }, messages }, { headers: { 'Cache-Control': 'no-store' } });
}

// Admin: reply to the customer — shown in their website chat within a few seconds.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (!isId(params.id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const { text } = await request.json().catch(() => ({}));
  const clean = typeof text === 'string' ? text.trim().slice(0, 2000) : '';
  if (!clean) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const conv = await getConversation(params.id);
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const id = await addMessage(conv.id, 'owner', clean);
  await markSeen(conv.id);
  return NextResponse.json({ ok: true, id });
}
