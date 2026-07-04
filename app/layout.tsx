import type { Metadata } from "next";
import "@/app/globals.css";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { siteUrl, socialImage } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "AiFrogi | WhatsApp Automation for Business",
  description: "Run WhatsApp broadcasts, AI chatbots, reminders, payments, retargeting, and human handover from one secure business workspace.",
  applicationName: "AiFrogi",
  authors: [{ name: "webtechnosys", url: "https://webtechnosys.com" }],
  creator: "webtechnosys",
  publisher: "webtechnosys",
  referrer: "origin-when-cross-origin",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "AiFrogi",
    title: "AiFrogi | WhatsApp Automation for Business",
    description: "WhatsApp automation, AI assistance, campaigns, payments, and human handover in one business workspace.",
    url: "/",
    images: [{ url: socialImage, width: 1265, height: 712, alt: "AiFrogi WhatsApp business workspace" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AiFrogi | WhatsApp Automation for Business",
    description: "WhatsApp automation, AI assistance, campaigns, payments, and human handover in one business workspace.",
    images: [socialImage]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  icons: {
    icon: "/brand/aifrogi-favicon.jpg",
    shortcut: "/brand/aifrogi-favicon.jpg",
    apple: "/brand/aifrogi-favicon.jpg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://aifrogi.com/#organization",
        name: "webtechnosys",
        url: "https://webtechnosys.com",
        email: "info@aifrogi.com",
        telephone: "+91-7410582898",
        address: {
          "@type": "PostalAddress",
          streetAddress: "H.No 746 - TF, New Wada",
          addressLocality: "Morjim",
          addressRegion: "Goa",
          postalCode: "403512",
          addressCountry: "IN"
        },
        brand: { "@type": "Brand", name: "AiFrogi" }
      },
      {
        "@type": "WebSite",
        "@id": "https://aifrogi.com/#website",
        name: "AiFrogi",
        url: "https://aifrogi.com",
        publisher: { "@id": "https://aifrogi.com/#organization" },
        inLanguage: "en"
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://aifrogi.com/#software",
        name: "AiFrogi",
        url: "https://aifrogi.com",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: "WhatsApp business messaging, automation, AI assistance, campaigns, payments, and human handover in one workspace.",
        provider: { "@id": "https://aifrogi.com/#organization" },
        offers: { "@type": "Offer", price: 0, priceCurrency: "INR", url: "https://aifrogi.com/pricing" }
      }
    ]
  };

  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content" tabIndex={-1}>
          <AppStateProvider>{children}</AppStateProvider>
        </div>
      </body>
    </html>
  );
}
