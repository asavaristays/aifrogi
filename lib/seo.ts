import type { Metadata } from "next";

export const siteUrl = new URL("https://aifrogi.com");
export const socialImage = "/brand/ai-frogi-site-image.jpg";

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
      images: [{ url: socialImage, width: 150, height: 137, alt: "AiFrogi AI business bot mascot" }]
    },
    twitter: { card: "summary", title, description, images: [socialImage] }
  };
}
