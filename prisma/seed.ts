import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_PROPERTY_SLUG } from "../lib/env";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const property = await prisma.property.upsert({
    where: { slug: DEFAULT_PROPERTY_SLUG },
    update: {
      name: "HotelRADAR",
      city: "Goa",
      state: "Goa",
      timezone: "Asia/Kolkata"
    },
    create: {
      name: "HotelRADAR",
      slug: DEFAULT_PROPERTY_SLUG,
      city: "Goa",
      state: "Goa",
      timezone: "Asia/Kolkata"
    }
  });

  await prisma.metricDaily.upsert({
    where: {
      propertyId_date: {
        propertyId: property.id,
        date: new Date("2026-06-01T00:00:00.000Z")
      }
    },
    update: {
      totalLeads: 0,
      confirmedRevenue: 0,
      otaCommissionSaved: 0,
      averageLeadScore: 0,
      highScoreLeadCount: 0,
      confirmedBookings: 0,
      directGuestsAcquired: 0
    },
    create: {
      propertyId: property.id,
      date: new Date("2026-06-01T00:00:00.000Z")
    }
  });

  const assetData = [
    {
      id: "seed-hotelradar-leados-overview",
      title: "AiFrogi Revenue Intelligence Overview",
      description: "HotelRADAR lead attention system for WhatsApp, AI bot, email, calls, and manual inquiries.",
      type: "BROCHURE_LINK",
      category: "BROCHURE",
      url: "https://hotelradar.in/lead/",
      tags: ["leados", "lead-capture", "revenue-recovery"]
    },
    {
      id: "seed-hotelradar-whatsapp-api-bot",
      title: "WhatsApp API Bot",
      description: "Direct booking conversation automation with instant replies, quote sharing, and team handoff.",
      type: "BROCHURE_LINK",
      category: "BROCHURE",
      url: "https://hotelradar.in/whatsapp-automation/",
      tags: ["whatsapp", "direct-booking", "guest-chat"]
    },
    {
      id: "seed-hotelradar-ai-bot",
      title: "AI Bot",
      description: "Website concierge assistant for hotel visitors, instant answers, room guidance, and lead capture.",
      type: "BROCHURE_LINK",
      category: "BROCHURE",
      url: "https://hotelradar.in/ai-bot/",
      tags: ["ai-bot", "website-chat", "guest-assistant"]
    },
    {
      id: "seed-hotelradar-platform",
      title: "HotelRADAR Platform",
      description: "AI automation and solutions platform for modern hotel operations and revenue intelligence.",
      type: "DOCUMENT_LINK",
      category: "OTHER",
      url: "https://hotelradar.in/",
      tags: ["hotelradar", "platform", "automation"]
    }
  ] as const;

  for (const asset of assetData) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {
        propertyId: property.id,
        title: asset.title,
        description: asset.description,
        type: asset.type as never,
        category: asset.category as never,
        url: asset.url,
        tags: [...asset.tags],
        thumbnailUrl: null,
        isActive: true,
        createdBy: "system"
      },
      create: {
        id: asset.id,
        propertyId: property.id,
        title: asset.title,
        description: asset.description,
        type: asset.type as never,
        category: asset.category as never,
        url: asset.url,
        tags: [...asset.tags],
        createdBy: "system"
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
