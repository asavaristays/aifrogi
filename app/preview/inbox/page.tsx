import { notFound } from "next/navigation";
import { WhatsAppBotClient } from "@/components/whatsapp/whatsapp-bot-client";
import type { Lead, WhatsAppIntegration } from "@/types";

const now = Date.now();

function minutesAgo(minutes: number) {
  return new Date(now - minutes * 60 * 1000).toISOString();
}

const integration: WhatsAppIntegration = {
  id: "preview-whatsapp",
  provider: "cloud-api",
  businessAccountId: "1310053467777467",
  phoneNumberId: "1185216074675443",
  displayPhoneNumber: "+91 70589 63898",
  status: "CONNECTED",
  approvedBy: "AiFrogi",
  approvedAtLabel: "Today",
  lastValidatedAtLabel: "Just now",
  notes: "Preview integration",
  aiModeEnabled: true
};

const leads: Lead[] = [
  {
    id: "lead-audit",
    name: "Kendra Lord",
    initials: "KL",
    score: 88,
    isHighPriority: true,
    source: "WhatsApp Campaign",
    stage: "New Enquiry",
    minutesAgo: 12,
    language: "EN",
    intent: "AI audit for Goa hotel",
    stay: "kendralordhotel.com",
    party: "Website and WhatsApp automation",
    budget: "Budget not shared",
    phone: "+91 88005 07181",
    updatedAtLabel: "12m ago",
    updatedAtIso: minutesAgo(12),
    tags: ["AI Audit", "Campaign Reply", "Needs Agent"],
    transcript: [
      {
        id: "m1",
        from: "agent",
        text: "Hi, this is AiFrogi. We are demonstrating an AI-assisted campaign workflow.",
        time: "3:49 PM",
        sentAtIso: minutesAgo(80),
        status: "read"
      },
      {
        id: "m2",
        from: "guest",
        text: "I want audit for my property. What details do you need?",
        time: "4:02 PM",
        sentAtIso: minutesAgo(12)
      }
    ]
  },
  {
    id: "lead-trial",
    name: "Morjim Beach Villa",
    initials: "MB",
    score: 72,
    source: "WhatsApp Inbound",
    stage: "Qualified",
    minutesAgo: 34,
    language: "EN",
    intent: "30-day trial",
    stay: "morjimbeachvilla.in",
    party: "Lead reply automation",
    budget: "Starter plan",
    phone: "+91 98289 81000",
    updatedAtLabel: "34m ago",
    updatedAtIso: minutesAgo(34),
    tags: ["Trial", "WhatsApp"],
    transcript: [
      {
        id: "m3",
        from: "guest",
        text: "Can we test the 30 day trial for our villa leads?",
        time: "3:40 PM",
        sentAtIso: minutesAgo(34)
      },
      {
        id: "m4",
        from: "ai",
        text: "Yes. Please share your website, WhatsApp number, current lead source, and the first workflow you want to automate.",
        time: "3:41 PM",
        sentAtIso: minutesAgo(33),
        status: "delivered"
      }
    ]
  },
  {
    id: "lead-template",
    name: "Calangute Stay",
    initials: "CS",
    score: 54,
    source: "WhatsApp Inbound",
    stage: "Contacted",
    minutesAgo: 1460,
    language: "EN",
    intent: "Pricing and setup",
    stay: "calangutestay.example",
    party: "Pricing query",
    budget: "Not shared",
    phone: "+91 90000 11122",
    updatedAtLabel: "Yesterday",
    updatedAtIso: minutesAgo(1460),
    tags: ["Template Required"],
    transcript: [
      {
        id: "m5",
        from: "guest",
        text: "Please send pricing details tomorrow.",
        time: "Yesterday",
        sentAtIso: minutesAgo(1460)
      }
    ]
  },
  {
    id: "lead-failed",
    name: "Goa Heritage Resort",
    initials: "GH",
    score: 61,
    source: "Broadcast Campaign",
    stage: "Follow-up",
    minutesAgo: 55,
    language: "EN",
    intent: "Campaign response",
    stay: "goaheritage.example",
    party: "AI audit",
    budget: "Not shared",
    phone: "+91 91111 22233",
    updatedAtLabel: "55m ago",
    updatedAtIso: minutesAgo(55),
    tags: ["Campaign", "Failed Delivery"],
    transcript: [
      {
        id: "m6",
        from: "agent",
        text: "Sharing your free AI audit link.",
        time: "2:50 PM",
        sentAtIso: minutesAgo(55),
        status: "failed_payment_required"
      }
    ]
  }
];

export default function PreviewInboxPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fbf9fc] p-5">
      <WhatsAppBotClient integration={integration} leads={leads} />
    </main>
  );
}
