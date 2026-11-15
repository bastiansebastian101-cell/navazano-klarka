import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { listConversations } from '@/lib/chat/store';

export const dynamic = 'force-dynamic';

// Admin: list of website chats (newest first) with unread counts — the inbox polls this.
export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const conversations = await listConversations();
  const unreadTotal = conversations.reduce((s, c) => s + c.unread, 0);
  return NextResponse.json({ conversations, unreadTotal }, { headers: { 'Cache-Control': 'no-store' } });
}
