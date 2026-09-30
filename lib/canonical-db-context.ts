import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import type { Prisma } from "../generated/prisma/client";

export type CanonicalRole = "aifrogi_web" | "aifrogi_public" | "aifrogi_worker" | "aifrogi_publisher";
export type CanonicalIdentity = { organizationId:string; propertyId:string; principal:string; purpose:string; guestSessionHash?:string };
declare global {
  // Startup instrumentation and route handlers may live in separate Next.js
  // bundles but execute in the same process. Keep one role registry across
  // those bundles instead of relying on module-local state.
  // eslint-disable-next-line no-var
  var __aifrogiCanonicalRoleClients__:Partial<Record<CanonicalRole,PrismaClient>>|undefined;
}
const clients=globalThis.__aifrogiCanonicalRoleClients__??={};
globalThis.__aifrogiCanonicalRoleClients__=clients;

const roleUrls: Record<CanonicalRole,string> = {
  aifrogi_web: "AIFROGI_WEB_DATABASE_URL",
  aifrogi_public: "AIFROGI_PUBLIC_DATABASE_URL",
  aifrogi_worker: "AIFROGI_WORKER_DATABASE_URL",
  aifrogi_publisher: "AIFROGI_PUBLISHER_DATABASE_URL"
};

export function initializeCanonicalRoleClients(env:NodeJS.ProcessEnv=process.env) {
  const configuredPoolSize=Number.parseInt(env.AIFROGI_CANONICAL_DATABASE_POOL_MAX||"10",10);
  const poolSize=Number.isFinite(configuredPoolSize)?Math.min(25,Math.max(2,configuredPoolSize)):10;
  for (const role of Object.keys(roleUrls) as CanonicalRole[]) {
    if (clients[role]) continue;
    const connectionString=env[roleUrls[role]];
    if (!connectionString) throw new Error(`CANONICAL_ROLE_DATABASE_URL_MISSING:${role}`);
    clients[role]=new PrismaClient({adapter:new PrismaPg({connectionString,connectionTimeoutMillis:5000,max:poolSize})});
  }
}

export function registerCanonicalRoleClient(role:CanonicalRole, client:PrismaClient) {
  if (clients[role]) throw new Error("CANONICAL_ROLE_CLIENT_ALREADY_REGISTERED");
  clients[role]=client;
}

export async function disconnectCanonicalRoleClients() {
  await Promise.all(Object.values(clients).map(client=>client?.$disconnect()));
  for (const role of Object.keys(clients) as CanonicalRole[]) delete clients[role];
}

export async function withCanonicalRole<T>(role:CanonicalRole, identity:CanonicalIdentity, work:(tx:Prisma.TransactionClient)=>Promise<T>) {
  const client=clients[role];
  if (!client || !identity.organizationId || !identity.propertyId || !identity.principal || !identity.purpose) throw new Error("CANONICAL_CONTEXT_INCOMPLETE");
  return client.$transaction(async tx => {
    const rows=await tx.$queryRaw<Array<{role:string}>>`SELECT session_user::text AS role`;
    if (rows[0]?.role!==role) throw new Error("CANONICAL_DATABASE_ROLE_MISMATCH");
    await tx.$executeRaw`SELECT set_config('app.organization_id',${identity.organizationId},true)`;
    await tx.$executeRaw`SELECT set_config('app.property_id',${identity.propertyId},true)`;
    await tx.$executeRaw`SELECT set_config('app.security_actor',${identity.principal},true)`;
    await tx.$executeRaw`SELECT set_config('app.system_purpose',${identity.purpose},true)`;
    await tx.$executeRaw`SELECT set_config('app.guest_session_hash',${identity.guestSessionHash??""},true)`;
    return work(tx);
  });
}
