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
  ] }} /></AppShell>;
}

