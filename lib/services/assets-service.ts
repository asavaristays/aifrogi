import { isDatabaseAccessError } from "@/lib/errors";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { normalizeAssetInput, validateAssetInput } from "@/lib/assets-payload";
import { mapAssetRecord, mapAssetShareRecord } from "@/lib/assets-mappers";
import {
  createAssetForProperty,
  getAssetsForProperty,
  getAssetSharesForLead,
  shareAssetToLead
} from "@/lib/repositories/asset-repository";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import type { Asset, AssetInput, AssetShare } from "@/types";

export async function loadAssets(propertySlug = DEFAULT_PROPERTY_SLUG): Promise<Asset[]> {
  try {
    const records = await getAssetsForProperty(propertySlug);
    if (!records) return [];
    return records.map(mapAssetRecord);
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return [];
    }
    throw error;
  }
}

export async function createAsset(input: AssetInput, propertySlug = DEFAULT_PROPERTY_SLUG) {
  const validationError = validateAssetInput(input);
  if (validationError) {
    return { error: validationError, asset: null as Asset | null, status: 400 };
  }

  try {
    const property = await getPropertyBySlug(propertySlug);
    if (!property) {
      return { error: "Property not found or database unavailable", asset: null as Asset | null, status: 503 };
    }

    const normalized = normalizeAssetInput(input);
    const created = await createAssetForProperty(property.id, normalized);
    if (!created) {
      return { error: "Database unavailable", asset: null as Asset | null, status: 503 };
    }

    return { error: null, asset: mapAssetRecord(created), status: 201 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", asset: null as Asset | null, status: 503 };
    }
    throw error;
  }
}

export async function loadLeadAssetShares(leadId: string): Promise<AssetShare[]> {
  try {
    const records = await getAssetSharesForLead(leadId);
    if (!records) return [];
    return records.map(mapAssetShareRecord);
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return [];
    }
    throw error;
  }
}

export async function createLeadAssetShare(input: {
  leadId: string;
  assetId: string;
  channel?: string;
  note?: string;
}) {
  if (!input.leadId || !input.assetId) {
    return { error: "leadId and assetId are required", share: null as AssetShare | null, status: 400 };
  }

  try {
    const created = await shareAssetToLead({
      leadId: input.leadId,
      assetId: input.assetId,
      channel: input.channel,
      note: input.note
    });

    if (!created) {
      return { error: "Database unavailable", share: null as AssetShare | null, status: 503 };
    }

    return { error: null, share: mapAssetShareRecord(created), status: 201 };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return { error: "Database unavailable", share: null as AssetShare | null, status: 503 };
    }
    throw error;
  }
}
