import "dotenv/config";
import { getDb } from "../lib/db";
import { createPropertyWorkspace } from "../lib/repositories/property-repository";
import { upsertWhatsAppIntegrationForProperty } from "../lib/repositories/whatsapp-repository";

function readArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length).trim() ?? "";
}

async function main() {
  const name = readArgument("name");
  const slug = readArgument("slug");
  const businessAccountId = readArgument("waba");
  const phoneNumberId = readArgument("phone");

  if (!name || !slug || !businessAccountId || !phoneNumberId) {
    throw new Error("Required arguments: --name, --slug, --waba and --phone");
  }

  const property = await createPropertyWorkspace({ name, slug });
  if (!property) throw new Error("Database unavailable");

  await upsertWhatsAppIntegrationForProperty(property.id, {
    provider: "META_CLOUD_API",
    businessAccountId,
    phoneNumberId,
    displayPhoneNumber: null,
    webhookVerifyToken: `leados-${slug}-verify`,
    accessToken: null,
    notes: `Official Meta WhatsApp Cloud API workspace for ${name}`,
    approvedBy: null,
    aiModeEnabled: false
  });

  process.stdout.write(JSON.stringify({
    name: property.name,
    slug: property.slug,
    businessAccountId,
    phoneNumberId,
    status: "CONFIGURED"
  }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getDb()?.$disconnect();
  });
