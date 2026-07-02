import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | AiFrogi",
  description: "AiFrogi privacy policy."
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="Your data, handled responsibly."
      summary="This policy explains how AiFrogi, operated by webtechnosys, collects, uses, stores, and protects information when businesses use the platform and its WhatsApp Business integrations."
    >
      <LegalSection title="1. Information we collect">
        <p>We may collect account details, business contact information, workspace settings, support correspondence, and technical information needed to operate and secure the service.</p>
        <p>When a business connects WhatsApp Business, AiFrogi may process phone numbers, profile names, message content, attachments, message timestamps, delivery status, and conversation history on that business&apos;s behalf.</p>
      </LegalSection>

      <LegalSection title="2. How we use information">
        <p>We use information to provide the AiFrogi service, deliver and receive WhatsApp messages, display conversation history, support users, monitor service reliability, prevent abuse, and meet legal obligations.</p>
        <p>AiFrogi does not sell personal information or use customer message content for unrelated advertising.</p>
      </LegalSection>

      <LegalSection title="3. Service providers and Meta">
        <p>AiFrogi uses infrastructure and service providers necessary to operate the platform. WhatsApp messages are also processed by Meta Platforms and WhatsApp under their applicable terms and privacy policies.</p>
        <p>We disclose information only when required to provide the service, comply with law, protect users, or respond to a valid legal request.</p>
      </LegalSection>

      <LegalSection title="4. Retention and security">
        <p>We retain account and conversation data while the customer account is active and for a limited period afterward when needed for security, dispute resolution, or legal compliance. Customers may request deletion as described in our Data Deletion Instructions.</p>
        <p>We use access controls, encryption for stored integration credentials, secure transport, and operational safeguards. No internet service can guarantee absolute security.</p>
      </LegalSection>

      <LegalSection title="5. Your choices and rights">
        <p>You may request access, correction, export, restriction, or deletion of personal information, subject to applicable law. Business customers are responsible for obtaining appropriate consent before messaging contacts through WhatsApp.</p>
      </LegalSection>

      <LegalSection title="6. Contact us">
        <p>For privacy questions or requests, email <a className="font-black text-[#c725ba]" href="mailto:info@aifrogi.com">info@aifrogi.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
