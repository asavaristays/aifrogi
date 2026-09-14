import fs from "node:fs";

const file = "/var/www/lead-os-ai/data/runtime/knowledge-settings-asavaristays-703624.json";
const settings = JSON.parse(fs.readFileSync(file, "utf8"));
const existing = Array.isArray(settings.widgetMenu?.items) ? settings.widgetMenu.items : [];
const booking = {
  id: "book-online",
  label: "Book online",
  action: "BOOKING",
  icon: "link",
  featured: true,
  value: "https://asavaristays.com/",
  children: [
    ["Mukteshwar", "Kates Adobe", "33"],
    ["Coorg", "Wild Cat Coorg", "38"],
    ["Chikmagalur", "Bean Aroma", "29"],
    ["Dudhwa", "Oel Nature Retreat", "35"],
    ["Corbett", "Camp Hornbill", "30"],
    ["Jodhpur", "Rohet House", "10"],
    ["Jodhpur", "Rohet Garh", "47"],
    ["Coorg", "Sagar Estate", "39"],
    ["Pushkar", "Mayagarh", "34"],
    ["Jawai", "J Wild Jawai", "32"],
    ["Jawai", "Jawai Damstay", "31"],
    ["Jodhpur", "Mihirgarh", "28"]
  ].map(([destination, stay, propertyId]) => ({
    id: `stay-${propertyId}`,
    label: `${destination}|${stay}`,
    action: "LINK",
    icon: "link",
    value: `https://asavaristays.com/properties/${propertyId}`
  }))
};
settings.widgetMenu = {
  enabled: true,
  heading: settings.widgetMenu?.heading || "What would you like to explore?",
  items: [booking, ...existing.filter((item) => item.id !== booking.id && !/\b(?:book|booking|reserve|reservation)\b/i.test(`${item.label || ""} ${item.value || ""}`)).map((item) => ({ ...item, featured: false }))].slice(0, 6)
};
settings.customInstructions = `${String(settings.customInstructions || "").trim()} For online booking requests, use only the approved Book online destination in the Main menu. Never claim that a booking or payment is confirmed until the booking system returns verified confirmation.`.trim();
settings.updatedAt = new Date().toISOString();
fs.writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o644 });
console.log("Asavaristays approved booking menu enabled.");
