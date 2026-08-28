import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { marketingMetadata } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Terms of Service | AiFrogi",
  description: "Terms governing AiFrogi AI business bot accounts, customer data, intelligent automation, supported channels including WhatsApp, acceptable use, service operation, and billing.",
  path: "/terms-of-service"
});

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms of service"
      title="Clear terms for responsible use."
      summary="These terms govern access to AiFrogi, operated by webtechnosys, including its shared inbox, WhatsApp Business integration, messaging, contacts, campaigns, and analytics."
    >
      <LegalSection title="1. Acceptance and eligibility">
        <p>By accessing AiFrogi, you agree to these terms and confirm that you are authorized to act for the business account you connect. If you do not agree, do not use the service.</p>
      </LegalSection>

      <LegalSection title="2. Accounts and access">
        <p>You are responsible for accurate account information, authorized user access, credential security, and activity performed through your workspace. Notify AiFrogi promptly if you suspect unauthorized access.</p>
      </LegalSection>

      <LegalSection title="3. WhatsApp and acceptable use">
        <p>You must follow applicable law and the Meta and WhatsApp Business terms, commerce policies, template rules, opt-in requirements, and messaging limits. You may not send spam, deceptive content, unlawful material, or messages to contacts who have not provided the required consent.</p>
      </LegalSection>

      <LegalSection title="4. Customer data">
        <p>You retain responsibility for customer data submitted to AiFrogi. You authorize webtechnosys, as the platform operator, to process that data only as needed to provide, secure, support, and improve the contracted service.</p>
      </LegalSection>

      <LegalSection title="5. Service operation">
        <p>We aim to provide a reliable service, but availability can be affected by maintenance, network conditions, Meta or WhatsApp platform changes, and third-party outages. Features may change as the platform develops.</p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>AiFrogi software, branding, design, and documentation remain the property of webtechnosys and its licensors. These terms grant only a limited right to use the service for authorized business purposes.</p>
      </LegalSection>

      <LegalSection title="7. Suspension and termination">
        <p>The introductory trial lasts 30 days and is not a free-forever plan. At trial expiry, messaging, campaigns, automation, and other paid actions pause automatically until a paid plan is activated. Workspace data remains preserved subject to the retention and deletion terms. We may also restrict or suspend access for security threats, unlawful activity, material policy violations, non-payment, or conduct that risks the service or third-party platforms.</p>
      </LegalSection>

      <LegalSection title="8. Liability and contact">
        <p>To the extent permitted by law, webtechnosys is not liable for indirect or consequential loss, lost profits, or failures caused by third-party services. Questions about these terms may be sent to <a className="font-black text-[#c725ba]" href="mailto:info@aifrogi.com">info@aifrogi.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
