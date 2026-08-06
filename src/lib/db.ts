import { PrismaClient } from '@prisma/client';

// Neon's serverless Postgres silently closes idle connections; a pooled Prisma
// client can be left holding one and fails with P1017 ("server has closed the
// connection") on the next query. Retrying once transparently recovers from
// this. Only read operations are retried — never writes, since a write that
// actually landed before the connection dropped must not be repeated.
const RETRYABLE_CODES = new Set(['P1017', 'P1001']);
const READ_OPERATIONS = new Set(['findFirst', 'findUnique', 'findMany', 'count', 'aggregate', 'groupBy']);

function createPrismaClient() {
  return new PrismaClient({ log: ['error'] }).$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args);
        } catch (err) {
          const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : undefined;
          if (code && RETRYABLE_CODES.has(code) && READ_OPERATIONS.has(operation)) {
            return await query(args);
          }
          throw err;
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
