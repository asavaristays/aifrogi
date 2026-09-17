import { getDb } from "@/lib/db";
import { isDatabaseAccessError } from "@/lib/errors";
import { resolveMemberOrganization, withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

export async function getPropertyBySlug(slug: string) {
  const db = getDb();
  if (!db) return null;

  try {
    return await db.property.findUnique({
      where: { slug }
    });
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return null;
    }
    throw error;
  }
}

export async function listProperties() {
  const db = getDb();
  if (!db) return [];

  try {
    return await db.property.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        organization: {
          select: {
            botProfile: { select: { status: true } }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  } catch (error) {
    if (isDatabaseAccessError(error)) return [];
    throw error;
  }
}

export async function listPropertiesForMember(email: string, isAdmin = false) {
  try {
    if (isAdmin) {
      const db = getDb();
      if (!db) return [];
      return await db.property.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          organization: {
            select: {
              botProfile: { select: { status: true } }
            }
          }
        },
        orderBy: { createdAt: "asc" }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const organizationId = await resolveMemberOrganization(normalizedEmail);
    if (!organizationId) return [];
    return await withTenantDatabaseContext({
      kind: "tenant",
      organizationId,
      actor: `member-properties:${normalizedEmail}`
    }, async () => {
      const db = getDb();
      if (!db) return [];
      return db.property.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          organization: {
            select: {
              botProfile: { select: { status: true } }
            }
          }
        },
        orderBy: { createdAt: "asc" }
      });
    });
  } catch (error) {
    if (isDatabaseAccessError(error)) return [];
    throw error;
  }
}

export async function createPropertyWorkspace(input: { name: string; slug: string }) {
  const db = getDb();
  if (!db) return null;

  return db.property.upsert({
    where: { slug: input.slug },
    update: { name: input.name },
    create: {
      name: input.name,
      slug: input.slug,
      timezone: "Asia/Kolkata"
    }
  });
}
