import { PrismaPg } from "@prisma/adapter-pg";
import { hasDatabaseUrl } from "@/lib/env";
import { PrismaClient } from "../generated/prisma/client";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma } from "../generated/prisma/client";

const transactionContext = new AsyncLocalStorage<PrismaClient>();
export type DatabaseIdentity = {
  organizationId: string;
  platformAuthority: boolean;
  actor: string;
  systemPurpose: string;
};
const identityContext = new AsyncLocalStorage<DatabaseIdentity>();

export class MissingDatabaseIdentityError extends Error {
  readonly code = "MISSING_DATABASE_IDENTITY";
  constructor() {
    super("Protected database access requires an explicit tenant, platform, or system identity.");
    this.name = "MissingDatabaseIdentityError";
  }
}

export function withDatabaseIdentity<T>(identity: DatabaseIdentity, work: () => Promise<T>) {
  return identityContext.run(identity, work);
}

export function enterDatabaseIdentity(identity: DatabaseIdentity) {
  identityContext.enterWith(identity);
}

function contextualClient(client: Prisma.TransactionClient) {
  return new Proxy(client as unknown as PrismaClient, {
    get(target, property, receiver) {
      if (property === "$transaction") {
        return async <T>(work: ((transaction: Prisma.TransactionClient) => Promise<T>) | unknown) => {
          if (Array.isArray(work)) return Promise.all(work) as T;
          if (typeof work !== "function") throw new Error("Invalid nested database transaction.");
          return work(client);
        };
      }
      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

/** Keeps repository calls on one transaction without changing the process-wide client. */
export function withDatabaseTransaction<T>(client: Prisma.TransactionClient, work: () => Promise<T>) {
  return transactionContext.run(contextualClient(client), work);
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function baseDb(): PrismaClient | null {
  if (!hasDatabaseUrl()) return null;
  if (!globalThis.__prisma__) {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      connectionTimeoutMillis: 5000
    });
    globalThis.__prisma__ = new PrismaClient({ adapter });
  }
  return globalThis.__prisma__ ?? null;
}

export function getBootstrapDb() {
  return baseDb();
}

async function configureIdentity(transaction: Prisma.TransactionClient, identity: DatabaseIdentity) {
  await transaction.$queryRaw`SELECT set_config('app.organization_id', ${identity.organizationId}, true)`;
  await transaction.$queryRaw`SELECT set_config('app.platform_authority', ${identity.platformAuthority ? "true" : "false"}, true)`;
  await transaction.$queryRaw`SELECT set_config('app.security_actor', ${identity.actor}, true)`;
  await transaction.$queryRaw`SELECT set_config('app.system_purpose', ${identity.systemPurpose}, true)`;
}

function identityScopedClient(client: PrismaClient, identity: DatabaseIdentity) {
  const models = new Map<PropertyKey, unknown>();
  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === "$transaction") {
        return async <T>(work: ((transaction: Prisma.TransactionClient) => Promise<T>) | unknown, options?: { maxWait?: number; timeout?: number }) => {
          if (typeof work !== "function") throw new Error("Array transactions are not supported in an identity-scoped database context.");
          return target.$transaction(async (transaction) => {
            await configureIdentity(transaction, identity);
            return withDatabaseTransaction(transaction, () => work(transaction));
          }, options);
        };
      }
      if (typeof property === "string" && !property.startsWith("$") && property in target) {
        if (models.has(property)) return models.get(property);
        const delegate = Reflect.get(target, property, receiver);
        if (delegate && typeof delegate === "object") {
          const scopedDelegate = new Proxy(delegate, {
            get(delegateTarget, operation, delegateReceiver) {
              const value = Reflect.get(delegateTarget, operation, delegateReceiver);
              if (typeof value !== "function") return value;
              return (...args: unknown[]) => target.$transaction(async (transaction) => {
                await configureIdentity(transaction, identity);
                const transactionDelegate = Reflect.get(transaction, property) as Record<PropertyKey, (...values: unknown[]) => unknown>;
                return Reflect.get(transactionDelegate, operation).apply(transactionDelegate, args);
              });
            }
          });
          models.set(property, scopedDelegate);
          return scopedDelegate;
        }
      }
      const value = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

export function getDb(): PrismaClient | null {
  const transaction = transactionContext.getStore();
  if (transaction) return transaction;
  const client = baseDb();
  if (!client) return null;
  const identity = identityContext.getStore();
  if (!identity && process.env.NODE_ENV === "production") throw new MissingDatabaseIdentityError();
  return identity ? identityScopedClient(client, identity) : client;
}

/** Use in authenticated request surfaces where an unscoped query must fail visibly. */
export function getProtectedDb(): PrismaClient | null {
  const transaction = transactionContext.getStore();
  if (transaction) return transaction;
  const identity = identityContext.getStore();
  if (!identity) throw new MissingDatabaseIdentityError();
  const client = baseDb();
  return client ? identityScopedClient(client, identity) : null;
}
