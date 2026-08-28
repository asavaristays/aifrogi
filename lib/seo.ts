import type { Metadata } from "next";

export const siteUrl = new URL("https://aifrogi.com");
export const socialImage = "/brand/aifrogi-dashboard.png";

export function marketingMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    keywords: ["AI business bot", "intelligent business automation", "customer conversation AI", "AI workflow automation", "business chatbot", "WhatsApp automation"],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "AiFrogi",
      title,
      description,
      url: path,
      images: [{ url: socialImage, width: 1265, height: 712, alt: "AiFrogi AI business bot workspace" }]
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] }
  };
}
