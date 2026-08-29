import type { Metadata } from "next";
import "@/app/globals.css";
import { AppStateProvider } from "@/components/providers/app-state-provider";
import { siteUrl, socialImage } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "AiFrogi | Intelligent AI Bot for Business",
  description: "AiFrogi is an intelligent AI business bot that helps teams answer customers, automate follow-ups, manage workflows, and turn conversations into next actions across supported channels.",
  keywords: ["AI business bot", "intelligent business automation", "customer conversation AI", "AI workflow automation", "business chatbot", "WhatsApp automation"],
  applicationName: "AiFrogi",
  authors: [{ name: "webtechnosys", url: "https://webtechnosys.com" }],
  creator: "webtechnosys",
  publisher: "webtechnosys",
  referrer: "origin-when-cross-origin",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "AiFrogi",
    title: "AiFrogi | Intelligent AI Bot for Business",
    description: "Turn customer conversations into the right next action with an intelligent AI bot, workflow automation, and human control.",
    url: "/",
    images: [{ url: socialImage, width: 1265, height: 712, alt: "AiFrogi AI business bot workspace" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AiFrogi | Intelligent AI Bot for Business",
    description: "Turn customer conversations into the right next action with an intelligent AI bot, workflow automation, and human control.",
    images: [socialImage]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  icons: {
    icon: [{ url: "/brand/aifrogi-favicon-512.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/brand/aifrogi-favicon-512.png",
    apple: [{ url: "/brand/aifrogi-favicon-512.png", type: "image/png", sizes: "512x512" }]
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
        applicationSubCategory: "AI business automation",
        operatingSystem: "Web",
        description: "An intelligent AI business bot for customer conversations, workflow automation, follow-ups, knowledge-guided answers, and human-assisted operations across supported channels.",
        featureList: ["AI-guided customer conversations", "Workflow automation", "Knowledge-guided answers", "Human handover", "WhatsApp integration"],
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
