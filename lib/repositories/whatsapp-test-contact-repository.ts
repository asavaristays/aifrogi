import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import seedContacts from "@/data/whatsapp-test-contacts.seed.json";

export type WhatsAppTestContactStatus =
  | "needs_consent_check"
  | "approved_for_test"
  | "sent"
  | "replied"
  | "do_not_contact";

export type WhatsAppTestContact = {
  id: string;
  businessName: string;
  website: string;
  whatsappMobile: string;
  email: string;
  sourceUrl: string;
  contactBasis: string;
  campaignStatus: WhatsAppTestContactStatus;
  lastTestedAt?: string;
  notes?: string;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const runtimeFile = path.join(runtimeDir, "whatsapp-test-contacts.json");

function normalizeContact(input: Partial<WhatsAppTestContact>, index: number): WhatsAppTestContact {
  const digits = String(input.whatsappMobile || "").replace(/[^\d]/g, "");
  const phone = digits.length === 10 ? `+91${digits}` : digits ? `+${digits}` : "";
  const status = input.campaignStatus || "needs_consent_check";

  return {
    id: input.id || `goa-test-${String(index + 1).padStart(3, "0")}`,
    businessName: String(input.businessName || "").trim(),
    website: String(input.website || "").trim(),
    whatsappMobile: phone,
    email: String(input.email || "").trim(),
    sourceUrl: String(input.sourceUrl || "").trim(),
    contactBasis: String(input.contactBasis || "Manual test contact").trim(),
    campaignStatus: status,
    lastTestedAt: input.lastTestedAt,
    notes: input.notes
  };
}

async function ensureRuntimeFile() {
  await mkdir(runtimeDir, { recursive: true });
  try {
    await readFile(runtimeFile, "utf8");
  } catch {
    await writeFile(runtimeFile, JSON.stringify(seedContacts, null, 2), "utf8");
  }
}

export async function listWhatsAppTestContacts() {
  await ensureRuntimeFile();
  const raw = await readFile(runtimeFile, "utf8");
  const parsed = JSON.parse(raw) as Partial<WhatsAppTestContact>[];
  return parsed.map(normalizeContact).filter((contact) => contact.businessName && contact.whatsappMobile);
}

export async function saveWhatsAppTestContacts(contacts: WhatsAppTestContact[]) {
  await mkdir(runtimeDir, { recursive: true });
  await writeFile(runtimeFile, JSON.stringify(contacts.map(normalizeContact), null, 2), "utf8");
}

export async function upsertWhatsAppTestContact(input: Partial<WhatsAppTestContact>) {
  const contacts = await listWhatsAppTestContacts();
  const normalized = normalizeContact(input, contacts.length);
  if (!normalized.businessName || !normalized.whatsappMobile) {
    return { error: "Business name and WhatsApp mobile are required", contact: null, status: 400 };
  }

  const existingIndex = contacts.findIndex(
    (contact) => contact.id === normalized.id || contact.whatsappMobile === normalized.whatsappMobile
  );
  const nextContacts =
    existingIndex >= 0
      ? contacts.map((contact, index) => (index === existingIndex ? { ...contact, ...normalized, id: contact.id } : contact))
      : [...contacts, normalized];

  await saveWhatsAppTestContacts(nextContacts);
  return { error: null, contact: normalized, status: existingIndex >= 0 ? 200 : 201 };
}
