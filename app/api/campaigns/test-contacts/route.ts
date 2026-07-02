import { NextResponse } from "next/server";
import { listWhatsAppTestContacts, upsertWhatsAppTestContact } from "@/lib/repositories/whatsapp-test-contact-repository";

export async function GET() {
  const contacts = await listWhatsAppTestContacts();
  return NextResponse.json({
    contacts,
    summary: {
      total: contacts.length,
      approvedForTest: contacts.filter((contact) => contact.campaignStatus === "approved_for_test").length,
      needsConsentCheck: contacts.filter((contact) => contact.campaignStatus === "needs_consent_check").length
    }
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const result = await upsertWhatsAppTestContact(payload || {});

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ contact: result.contact }, { status: result.status });
}
