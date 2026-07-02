import { cookies } from "next/headers";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const WORKSPACE_COOKIE_NAME = "leados_workspace";

export async function getCurrentWorkspaceSlug() {
  const cookieStore = await cookies();
  const requestedSlug = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value?.trim() || DEFAULT_PROPERTY_SLUG;
  const user = await verifySessionToken(cookieStore.get(getSessionCookieName())?.value);
  if (!user || user.role === "admin") return requestedSlug;

  const db = getDb();
  if (!db) return requestedSlug;
  const property = await db.property.findFirst({
    where: {
      slug: requestedSlug,
      organization: {
        members: {
          some: {
            email: user.username.toLowerCase(),
            status: "ACTIVE"
          }
        }
      }
    },
    select: { slug: true }
  });
  if (property) return property.slug;

  const fallback = await db.property.findFirst({
    where: {
      organization: {
        members: {
          some: {
            email: user.username.toLowerCase(),
            status: "ACTIVE"
          }
        }
      }
    },
    select: { slug: true },
    orderBy: { createdAt: "asc" }
  });
  return fallback?.slug || requestedSlug;
}
