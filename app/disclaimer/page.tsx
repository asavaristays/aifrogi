import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Platform Disclaimer | AiFrogi",
  description: "Understand AiFrogi AI assistance, customer responsibilities, approvals, delivery, and service boundaries.",
  path: "/disclaimer"
});

export default function DisclaimerPage() {
  return <LegalPage eyebrow="Platform disclaimer" title="Clear boundaries. No hidden promises." summary="AiFrogi provides a governed website AI Bot using approved business knowledge and explicit human authority.">
    <LegalSection title="AI assistance"><p>AI-generated replies and recommendations may be incomplete. Customers should review high-impact commercial, legal, financial, medical, or sensitive responses and keep human handover enabled.</p></LegalSection>
    <LegalSection title="Approved truth"><p>AiFrogi uses approved knowledge and configured safeguards. A configured connector or workflow is not proof that an external action completed; verified completion requires retained provider evidence.</p></LegalSection>
    <LegalSection title="Customer responsibility"><p>Customers are responsible for accurate business information, lawful visitor-data collection, user access, approved content, and compliance with applicable law.</p></LegalSection>
    <LegalSection title="Provider boundaries"><p>Hosting, AI, email, payment, calendar, and other connected providers operate independently. AiFrogi cannot guarantee their availability, approval decisions, pricing, or delivery.</p></LegalSection>
  </LegalPage>;
}
