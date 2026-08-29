import type { MetadataRoute } from "next";
import { helpArticles } from "@/lib/help-center";
import { botProducts } from "@/lib/bot-products";
import { siteUrl } from "@/lib/seo";

const pages: Array<[string, MetadataRoute.Sitemap[number]["changeFrequency"], number]> = [
  ["/", "weekly", 1],
  ["/about", "monthly", 0.7],
  ["/solutions", "monthly", 0.9],
  ["/solutions/pingbook", "monthly", 0.9],
  ["/solutions/flowcart", "monthly", 0.9],
  ["/pricing", "weekly", 0.9],
  ["/onboarding-process", "monthly", 0.8],
  ["/integration", "monthly", 0.8],
  ["/resources", "weekly", 0.7],
  ["/help", "weekly", 0.7],
  ["/security", "monthly", 0.6],
  ["/status", "weekly", 0.6],
  ["/product-tour", "monthly", 0.6],
  ["/privacy-policy", "yearly", 0.3],
  ["/terms-of-service", "yearly", 0.3],
  ["/data-deletion", "yearly", 0.3],
  ["/disclaimer", "yearly", 0.3]
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = pages.map(([path, changeFrequency, priority]) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority
  }));
  const guides = helpArticles.map((article) => ({
    url: new URL(`/help/${article.slug}`, siteUrl).toString(),
    changeFrequency: "monthly" as const,
    priority: 0.6
  }));
  const productPages = botProducts.map((product) => ({
    url: new URL(`/solutions/${product.slug}`, siteUrl).toString(),
    changeFrequency: "monthly" as const,
    priority: 0.8
  }));
  return [...staticPages, ...productPages, ...guides];
}
