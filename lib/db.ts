import { PrismaPg } from "@prisma/adapter-pg";
import { hasDatabaseUrl } from "@/lib/env";
import { PrismaClient } from "../generated/prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma } from "../generated/prisma/client";

const transactionContext = new AsyncLocalStorage<Prisma.TransactionClient>();
/** Scoped to website persistence only; never changes the process-wide client. */
export function withDatabaseTransaction<T>(client: Prisma.TransactionClient, work: () => Promise<T>) {
  return transactionContext.run(client, work);
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export function getDb(): PrismaClient | null {
  const transaction = transactionContext.getStore();
  if (transaction) return transaction as PrismaClient;
  if (!hasDatabaseUrl()) {
    return null;
  }

  if (!globalThis.__prisma__) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      connectionTimeoutMillis: 5000
    });

    globalThis.__prisma__ = new PrismaClient({ adapter });
  }

  return globalThis.__prisma__ ?? null;
}
