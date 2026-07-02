import { AssetCategory, AssetType } from "../generated/prisma/client";
import type { AssetInput } from "@/types";

function toAssetType(value: string): AssetType {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "IMAGE":
      return AssetType.IMAGE;
    case "VIDEO_LINK":
    case "VIDEO":
      return AssetType.VIDEO_LINK;
    case "PDF":
      return AssetType.PDF;
    case "INVOICE_LINK":
    case "INVOICE":
      return AssetType.INVOICE_LINK;
    case "PAYMENT_LINK":
    case "PAYMENT":
      return AssetType.PAYMENT_LINK;
    case "BROCHURE_LINK":
    case "BROCHURE":
      return AssetType.BROCHURE_LINK;
    default:
      return AssetType.DOCUMENT_LINK;
  }
}

function toAssetCategory(value: string): AssetCategory {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "ROOM":
      return AssetCategory.ROOM;
    case "EXPERIENCE":
      return AssetCategory.EXPERIENCE;
    case "PROPERTY":
      return AssetCategory.PROPERTY;
    case "WEDDING":
      return AssetCategory.WEDDING;
    case "DINING":
      return AssetCategory.DINING;
    case "BROCHURE":
      return AssetCategory.BROCHURE;
    case "INVOICE":
      return AssetCategory.INVOICE;
    case "PAYMENT":
      return AssetCategory.PAYMENT;
    default:
      return AssetCategory.OTHER;
  }
}

export function validateAssetInput(input: Partial<AssetInput>) {
  const required = ["title", "type", "category", "url"] as const;
  for (const field of required) {
    if (!input[field] || String(input[field]).trim() === "") {
      return `${field} is required`;
    }
  }
  return null;
}

export function normalizeAssetInput(input: AssetInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    type: toAssetType(input.type),
    category: toAssetCategory(input.category),
    url: input.url.trim(),
    thumbnailUrl: input.thumbnailUrl?.trim() || null,
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean)
  };
}
