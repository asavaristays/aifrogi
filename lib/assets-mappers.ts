import type { Asset, AssetShare } from "@/types";
import type { AssetModel as PrismaAsset } from "../generated/prisma/models/Asset";
import type { LeadAssetShareModel as LeadAssetShare } from "../generated/prisma/models/LeadAssetShare";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function mapAssetRecord(asset: PrismaAsset): Asset {
  return {
    id: asset.id,
    title: asset.title,
    description: asset.description,
    type: asset.type,
    category: asset.category,
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl,
    tags: asset.tags,
    isActive: asset.isActive,
    updatedAtLabel: formatDate(asset.updatedAt)
  };
}

export function mapAssetShareRecord(
  share: LeadAssetShare & {
    asset: PrismaAsset;
  }
): AssetShare {
  return {
    id: share.id,
    leadId: share.leadId,
    assetId: share.assetId,
    assetTitle: share.asset.title,
    assetType: share.asset.type,
    assetUrl: share.asset.url,
    channel: share.channel,
    note: share.note,
    sharedAtLabel: formatDate(share.sharedAt)
  };
}
