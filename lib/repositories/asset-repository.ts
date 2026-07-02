import { getDb } from "@/lib/db";

export async function getAssetsForProperty(propertySlug: string) {
  const db = getDb();
  if (!db) return null;

  return db.asset.findMany({
    where: {
      property: {
        slug: propertySlug
      },
      isActive: true
    },
    orderBy: [{ updatedAt: "desc" }, { title: "asc" }]
  });
}

export async function createAssetForProperty(
  propertyId: string,
  input: {
    title: string;
    description: string | null;
    type: Parameters<NonNullable<ReturnType<typeof getDb>>["asset"]["create"]>[0]["data"]["type"];
    category: Parameters<NonNullable<ReturnType<typeof getDb>>["asset"]["create"]>[0]["data"]["category"];
    url: string;
    thumbnailUrl: string | null;
    tags: string[];
  }
) {
  const db = getDb();
  if (!db) return null;

  return db.asset.create({
    data: {
      propertyId,
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      tags: input.tags
    }
  });
}

export async function shareAssetToLead(input: {
  leadId: string;
  assetId: string;
  channel?: string;
  note?: string | null;
  sharedBy?: string | null;
}) {
  const db = getDb();
  if (!db) return null;

  return db.leadAssetShare.create({
    data: {
      leadId: input.leadId,
      assetId: input.assetId,
      channel: input.channel ?? "WHATSAPP",
      note: input.note ?? null,
      sharedBy: input.sharedBy ?? null
    },
    include: {
      asset: true
    }
  });
}

export async function getAssetSharesForLead(leadId: string) {
  const db = getDb();
  if (!db) return null;

  return db.leadAssetShare.findMany({
    where: { leadId },
    include: {
      asset: true
    },
    orderBy: {
      sharedAt: "desc"
    }
  });
}
