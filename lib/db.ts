import { PrismaPg } from "@prisma/adapter-pg";
import { hasDatabaseUrl } from "@/lib/env";
import { PrismaClient } from "../generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export function getDb(): PrismaClient | null {
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
