import { getDb } from "@/lib/db";
import { isDatabaseAccessError } from "@/lib/errors";

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
        whatsappIntegration: {
          select: {
            status: true,
            displayPhoneNumber: true
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
  const db = getDb();
  if (!db) return [];

  try {
    return await db.property.findMany({
      where: isAdmin ? undefined : {
        organization: {
          members: {
            some: {
              email: email.toLowerCase(),
              status: "ACTIVE"
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        whatsappIntegration: {
          select: {
            status: true,
            displayPhoneNumber: true
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
