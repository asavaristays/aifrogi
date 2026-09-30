// Proposed runtime boundary; not merged. Each client uses a distinct login
// whose current_user is exactly its NOINHERIT runtime role. No multi-role login
// and no runtime SET ROLE is permitted.
export type CanonicalRole = "aifrogi_web" | "aifrogi_public" | "aifrogi_worker" | "aifrogi_publisher";
export type CanonicalIdentity = { organizationId:string; propertyId:string; principal:string; purpose:string; guestSessionHash?:string };
type Tx = { $executeRaw:(q:TemplateStringsArray,...v:unknown[])=>Promise<unknown>; $queryRaw:<T>(q:TemplateStringsArray,...v:unknown[])=>Promise<T> };
type Client = { $transaction:<T>(fn:(tx:Tx)=>Promise<T>)=>Promise<T> };
const roleClients: Partial<Record<CanonicalRole,Client>> = {};

export function registerCanonicalRoleClient(role:CanonicalRole, client:Client) {
  if (roleClients[role]) throw new Error("CANONICAL_ROLE_CLIENT_ALREADY_REGISTERED");
  roleClients[role]=client;
}

export async function withCanonicalRole<T>(role:CanonicalRole, identity:CanonicalIdentity, work:(tx:Tx)=>Promise<T>) {
  const client=roleClients[role];
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

// require_context also validates the tuple against KnowledgeRuntimePrincipalGrant.
