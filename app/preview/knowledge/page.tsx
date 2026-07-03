import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";

export default function KnowledgePreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const crawledAt = new Date().toISOString();
  return <AppShell workspaces={[{ id: "preview", name: "AiFrogi Demo", slug: "hotelradar", status: "CONNECTED", displayPhoneNumber: "+91 70589 63898" }]} currentWorkspaceSlug="hotelradar" accessRole="OWNER"><KnowledgeWorkspace propertySlug="hotelradar" canManage initialSummary={{ settings: { propertySlug: "hotelradar", sourceUrl: "https://website.hotelradar.in", status: "READY", approvedForAi: true, autoRefreshHours: 6, customInstructions: "Answer the question first, remain concise, and ask no more than one useful follow-up question.", handoffTopics: ["Billing disputes", "Complaints", "Legal questions", "Sensitive personal data"], lastCrawledAt: crawledAt, pageCount: 8, buckets: ["Company and service overview", "Pricing and trial", "WhatsApp automation", "AI website audit"], lastError: null, updatedAt: crawledAt }, pages: [
    { url: "https://website.hotelradar.in/", title: "HotelRadar AI Agency", bucket: "Company and service overview", crawledAt },
    { url: "https://website.hotelradar.in/pricing/", title: "Plans and 30-day trial", bucket: "Pricing and trial", crawledAt },
    { url: "https://website.hotelradar.in/whatsapp-automation/", title: "WhatsApp automation", bucket: "WhatsApp automation", crawledAt },
    { url: "https://website.hotelradar.in/hotel-website-audit-goa/", title: "Free AI website audit", bucket: "AI website audit", crawledAt }
  ], propertyId: "preview", documents: [{ id: "doc-1", fileName: "AI operations and pricing.pdf", mimeType: "application/pdf", sizeBytes: 248000, status: "PENDING", conflictSummary: null, uploadedBy: "support@hotelradar.in", approvedBy: null, createdAt: crawledAt, updatedAt: crawledAt }], entries: [{ id: "entry-1", question: "What is included in the 30-day trial?", answer: "The trial includes a working setup review, one agreed workflow, and guided onboarding. Final scope is confirmed before activation.", category: "Pricing and trial", status: "APPROVED", conflictSummary: null, createdBy: "support@hotelradar.in", approvedBy: "support@hotelradar.in", createdAt: crawledAt, updatedAt: crawledAt }], gaps: [{ id: "gap-1", question: "Can this connect with our existing booking system?", occurrenceCount: 4, status: "OPEN", lastAskedAt: crawledAt }] }} /></AppShell>;
}
