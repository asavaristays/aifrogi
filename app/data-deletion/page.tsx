import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Business Bot Data Deletion | AiFrogi",
  description: "How businesses and individuals can request deletion of eligible account, customer conversation, attachment, AI workflow, and integration data from AiFrogi.",
  path: "/data-deletion"
});

export default function DataDeletionPage() {
  return (
    <LegalPage
      eyebrow="Data deletion"
      title="Request deletion of your data."
      summary="AiFrogi provides a direct process for businesses and individuals to request deletion of eligible information processed through the platform."
    >
      <LegalSection title="How to submit a request">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Email <a className="font-black text-[#8a6a16]" href="mailto:info@aifrogi.com?subject=AiFrogi%20Data%20Deletion%20Request">info@aifrogi.com</a> with the subject “AiFrogi Data Deletion Request”.</li>
          <li>Include your name, business or hotel name, WhatsApp number or account email, and a short description of the data you want deleted.</li>
          <li>We may request limited information to verify your identity or authority over the relevant account.</li>
        </ol>
      </LegalSection>

      <LegalSection title="What happens next">
        <p>We will acknowledge the request and, after verification, delete or anonymize eligible account data, conversation records, contact details, attachments, and integration information associated with the request.</p>
        <p>We aim to complete valid requests within 30 days. We will notify you if additional time is reasonably required.</p>
      </LegalSection>

      <LegalSection title="Information we may retain">
        <p>We may retain limited records when required for legal compliance, fraud prevention, security, billing, dispute resolution, or enforcement of agreements. Any retained information remains protected and is not used for unrelated purposes.</p>
      </LegalSection>

      <LegalSection title="Meta and WhatsApp data">
        <p>Deleting information from AiFrogi does not automatically delete information independently retained by Meta or WhatsApp. Requests concerning their systems should also be submitted through the privacy tools provided by those services.</p>
      </LegalSection>
    </LegalPage>
  );
}
