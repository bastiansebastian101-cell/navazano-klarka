import { randomBytes } from 'crypto';
import { prisma } from '../db';

// Website chat, kept in two small tables created on first use (no migrations in this project):
//   ChatConversation — one per visitor; `id` is a long random secret kept in the visitor's browser,
//                      `code` is a short label (e.g. K7Q2) shown in WhatsApp so the owner can tell chats apart.
//   ChatMessage      — every message: sender = 'visitor' | 'owner' | 'bot'. `waId` links a message we sent
//                      to WhatsApp, so a swipe-reply there finds the right conversation.

export type ChatSender = 'visitor' | 'owner' | 'bot';
export type ChatLang = 'cs' | 'en';
export type ChatMessageRow = { id: number; sender: ChatSender; text: string; createdAt: Date };
export type ConversationRow = { id: string; code: string; lang: ChatLang; name: string | null; lastActivity: Date };

let ready = false;
async function ensureTables() {
  if (ready) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "ChatConversation" ("id" TEXT PRIMARY KEY, "code" TEXT NOT NULL UNIQUE, "lang" TEXT NOT NULL DEFAULT 'cs', "name" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  );
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "ChatMessage" ("id" SERIAL PRIMARY KEY, "conversationId" TEXT NOT NULL, "sender" TEXT NOT NULL, "text" TEXT NOT NULL, "waId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`
  );
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ChatMessage_conv_idx" ON "ChatMessage" ("conversationId", "id")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ChatMessage_wa_idx" ON "ChatMessage" ("waId")`);
  ready = true;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
function makeCode() {
  const b = randomBytes(4);
  return Array.from(b, (x) => CODE_CHARS[x % CODE_CHARS.length]).join('');
}

export async function createConversation(lang: ChatLang): Promise<ConversationRow> {
  await ensureTables();
  const id = randomBytes(18).toString('base64url');
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    const rows = await prisma.$queryRaw<ConversationRow[]>`
      INSERT INTO "ChatConversation" ("id", "code", "lang") VALUES (${id}, ${code}, ${lang})
      ON CONFLICT ("code") DO NOTHING RETURNING "id", "code", "lang", "name", "lastActivity"`;
    if (rows[0]) return rows[0];
  }
  throw new Error('could_not_create_conversation');
}

export async function getConversation(id: string): Promise<ConversationRow | null> {
  await ensureTables();
  const rows = await prisma.$queryRaw<ConversationRow[]>`
    SELECT "id", "code", "lang", "name", "lastActivity" FROM "ChatConversation" WHERE "id" = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

export async function getConversationByCode(code: string): Promise<ConversationRow | null> {
  await ensureTables();
  const rows = await prisma.$queryRaw<ConversationRow[]>`
    SELECT "id", "code", "lang", "name", "lastActivity" FROM "ChatConversation" WHERE "code" = ${code.toUpperCase()} LIMIT 1`;
  return rows[0] ?? null;
}

export async function getConversationByWaId(waId: string): Promise<ConversationRow | null> {
  await ensureTables();
  const rows = await prisma.$queryRaw<ConversationRow[]>`
    SELECT c."id", c."code", c."lang", c."name", c."lastActivity" FROM "ChatMessage" m
    JOIN "ChatConversation" c ON c."id" = m."conversationId" WHERE m."waId" = ${waId} LIMIT 1`;
  return rows[0] ?? null;
}

/** The conversation where a visitor wrote most recently (within `minutes`). */
export async function latestVisitorConversation(minutes: number): Promise<ConversationRow | null> {
  await ensureTables();
  const rows = await prisma.$queryRaw<ConversationRow[]>`
    SELECT c."id", c."code", c."lang", c."name", c."lastActivity" FROM "ChatMessage" m
    JOIN "ChatConversation" c ON c."id" = m."conversationId"
    WHERE m."sender" = 'visitor' AND m."createdAt" > CURRENT_TIMESTAMP - make_interval(mins => ${minutes})
    ORDER BY m."id" DESC LIMIT 1`;
  return rows[0] ?? null;
}

export async function setConversationName(id: string, name: string) {
  await prisma.$executeRaw`UPDATE "ChatConversation" SET "name" = ${name} WHERE "id" = ${id}`;
}

export async function addMessage(conversationId: string, sender: ChatSender, text: string): Promise<number> {
  await ensureTables();
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    INSERT INTO "ChatMessage" ("conversationId", "sender", "text") VALUES (${conversationId}, ${sender}, ${text}) RETURNING "id"`;
  await prisma.$executeRaw`UPDATE "ChatConversation" SET "lastActivity" = CURRENT_TIMESTAMP WHERE "id" = ${conversationId}`;
  return rows[0].id;
}

export async function setMessageWaId(messageId: number, waId: string) {
  await prisma.$executeRaw`UPDATE "ChatMessage" SET "waId" = ${waId} WHERE "id" = ${messageId}`;
}

export async function countVisitorMessages(conversationId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(*)::int AS n FROM "ChatMessage" WHERE "conversationId" = ${conversationId} AND "sender" = 'visitor'`;
  return rows[0]?.n ?? 0;
}

export async function messagesAfter(conversationId: string, afterId: number): Promise<ChatMessageRow[]> {
  await ensureTables();
  return prisma.$queryRaw<ChatMessageRow[]>`
    SELECT "id", "sender", "text", "createdAt" FROM "ChatMessage"
    WHERE "conversationId" = ${conversationId} AND "id" > ${afterId} ORDER BY "id" ASC LIMIT 100`;
}
