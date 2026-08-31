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
      summary="These terms govern access to AiFrogi, operated by Webtechnosys, including AI Business Bots, approved knowledge, connectors, messaging, human handover and related services."
    >
      <LegalSection title="1. Acceptance and eligibility">
        <p>By accessing AiFrogi, you agree to these terms and confirm that you are authorized to act for the business account you connect. If you do not agree, do not use the service.</p>
      </LegalSection>

      <LegalSection title="2. Accounts and access">
        <p>You are responsible for accurate account information, authorized user access, credential security, and activity performed through your workspace. Notify AiFrogi promptly if you suspect unauthorized access.</p>
      </LegalSection>

      <LegalSection title="3. Acceptable use and connected channels">
        <p>You must follow applicable law and the terms of every connected provider. Where WhatsApp is enabled, this includes Meta and WhatsApp Business terms, commerce policies, template rules, opt-in requirements, and messaging limits. You may not use the service for spam, deception, unlawful content, unsafe automated decisions, or unauthorized access.</p>
      </LegalSection>

      <LegalSection title="4. Customer data">
        <p>You retain responsibility for customer data and business knowledge submitted to AiFrogi, including its accuracy, authority, consent, and continued relevance. You authorize Webtechnosys, as platform operator, to process that data as needed to provide, secure, support, and improve the contracted service. AI outputs must be reviewed before they are relied on for sensitive, regulated, financial, medical, legal, or irreversible decisions.</p>
      </LegalSection>

      <LegalSection title="5. Service operation">
        <p>We aim to provide a reliable service, but availability can be affected by maintenance, networks, AI-model providers, connected APIs, Meta or WhatsApp changes, and other third-party outages. Features may change as the platform develops. AiFrogi may refuse, pause, clarify, or hand a conversation to a human when evidence or authority is insufficient.</p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>AiFrogi software, branding, design, and documentation remain the property of webtechnosys and its licensors. These terms grant only a limited right to use the service for authorized business purposes.</p>
      </LegalSection>

      <LegalSection title="7. Trial, subscriptions and renewal">
        <p>The introductory trial lasts 15 days and is not a free-forever plan. At trial expiry, messaging, campaigns, automation, and other paid actions pause automatically until a paid plan is activated. Workspace data remains preserved subject to the retention and deletion terms. We may also restrict or suspend access for security threats, unlawful activity, material policy violations, non-payment, or conduct that risks the service or third-party platforms.</p>
        <p>Subscriptions are billed in advance for the selected monthly or yearly period and renew until cancelled. Cancellation stops the next renewal; service normally remains available until the current paid period ends. The applicable order, quotation, or checkout summary identifies the plan, billing period, taxes, published usage allowances, and any agreed extras.</p>
      </LegalSection>

      <LegalSection title="8. Connector projects and third-party charges">
        <p>Connector prices shown on the website are planning estimates. Final fees depend on the agreed scope, provider API access, data readiness, security requirements, testing, and custom development. A project may be divided into paid milestones. Client or provider delays may change delivery dates.</p>
        <p>AI-model usage, Meta messages, PMS or channel-manager subscriptions, commerce services, payment gateways, Google Workspace or other provider fees are not included unless the order expressly says otherwise. Provider pricing and availability can change independently of AiFrogi.</p>
      </LegalSection>

      <LegalSection title="9. Refunds and billing corrections">
        <p>Duplicate or demonstrably erroneous payments will be reviewed and corrected. Except where applicable law requires otherwise, an activated subscription or completed service period is non-refundable. Connector-project refunds are assessed against unstarted milestones; completed discovery, configuration, development, testing, provider fees, and third-party costs are non-refundable.</p>
        <p>A delay or failure caused by missing client information, unavailable credentials, rejected provider approval, incompatible third-party systems, or a client-requested scope change does not automatically create a refund entitlement. Contact us promptly so we can investigate and, where appropriate, pause unstarted work.</p>
      </LegalSection>

      <LegalSection title="10. Usage allowances and plan changes">
        <p>Current introductory-plan allowances are published on the pricing page and usage is visible inside the customer workspace. We may recommend or require a higher plan when an allowance is reached. No automatic overage fee will be charged without prior agreement, unless an existing order expressly authorizes usage-based billing.</p>
      </LegalSection>

      <LegalSection title="11. Liability and contact">
        <p>To the extent permitted by law, webtechnosys is not liable for indirect or consequential loss, lost profits, or failures caused by third-party services. Questions about these terms may be sent to <a className="font-black text-[#8a6a16]" href="mailto:info@aifrogi.com">info@aifrogi.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
