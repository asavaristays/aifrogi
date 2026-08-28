export type FlowCartVariant = {
  id: string;
  name: string;
  priceDeltaPaisa: number;
};

export type FlowCartAddon = {
  id: string;
  name: string;
  category: string;
  pricePaisa: number;
};

export type FlowCartProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  basePricePaisa: number;
  variants: FlowCartVariant[];
  addons: FlowCartAddon[];
};

export type FlowCartOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  variantName: string;
  totalPaisa: number;
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  fulfillmentStatus: "NEW" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  deliveryDate: string;
  deliverySlot: string;
  message: string;
};

export const EMILY_CAFE_TENANT = {
  id: "demo-flowcart-emily-cafe",
  aifrogiTenantId: "emily-cafe",
  name: "FlowCart for Emily Cafe",
  brandName: "Emily Cafe",
  status: "DEMO_READY",
  timezone: "Asia/Kolkata",
  currency: "INR",
  storeProvider: "DEMO",
  razorpayEnabled: true,
  whatsappFlowId: "flow_emily_cafe_order_v1",
  fulfillmentModes: ["pickup", "delivery"]
};

export const EMILY_CAFE_PRODUCTS: FlowCartProduct[] = [
  {
    id: "cake-signature-chocolate",
    name: "Signature Chocolate Cake",
    slug: "signature-chocolate-cake",
    category: "Birthday Cakes",
    description: "Rich chocolate sponge, ganache finish, custom birthday message, and same-day delivery slots.",
    imageUrl: "/brand/aifrogi-logo-transparent.png",
    basePricePaisa: 95000,
    variants: [
      { id: "cake-500g", name: "500g", priceDeltaPaisa: 0 },
      { id: "cake-1kg", name: "1kg", priceDeltaPaisa: 50000 },
      { id: "cake-2kg", name: "2kg", priceDeltaPaisa: 145000 }
    ],
    addons: [
      { id: "addon-candle", name: "Number candle", category: "celebration", pricePaisa: 12000 },
      { id: "addon-topper", name: "Custom topper", category: "celebration", pricePaisa: 18000 },
      { id: "addon-flowers", name: "Fresh flower garnish", category: "finish", pricePaisa: 22000 }
    ]
  },
  {
    id: "hamper-coffee-date",
    name: "Coffee Date Hamper",
    slug: "coffee-date-hamper",
    category: "Gift Hampers",
    description: "Two cold brews, brownies, cookies, greeting card, and ribbon packing for gifting.",
    imageUrl: "/brand/aifrogi-logo-transparent.png",
    basePricePaisa: 125000,
    variants: [
      { id: "hamper-classic", name: "Classic", priceDeltaPaisa: 0 },
      { id: "hamper-premium", name: "Premium", priceDeltaPaisa: 55000 }
    ],
    addons: [
      { id: "addon-card", name: "Handwritten card", category: "gift", pricePaisa: 9000 },
      { id: "addon-mug", name: "Emily Cafe mug", category: "gift", pricePaisa: 35000 }
    ]
  },
  {
    id: "platter-party-snack",
    name: "Party Snack Platter",
    slug: "party-snack-platter",
    category: "Party Orders",
    description: "Mini sandwiches, brownies, savoury bites, dips, and delivery coordination for small gatherings.",
    imageUrl: "/brand/aifrogi-logo-transparent.png",
    basePricePaisa: 180000,
    variants: [
      { id: "platter-8", name: "Serves 8", priceDeltaPaisa: 0 },
      { id: "platter-15", name: "Serves 15", priceDeltaPaisa: 145000 },
      { id: "platter-25", name: "Serves 25", priceDeltaPaisa: 320000 }
    ],
    addons: [
      { id: "addon-extra-dips", name: "Extra dips", category: "food", pricePaisa: 15000 },
      { id: "addon-compostable", name: "Compostable plates", category: "service", pricePaisa: 25000 }
    ]
  },
  {
    id: "box-cold-brew",
    name: "Cold Brew Box",
    slug: "cold-brew-box",
    category: "Coffee Boxes",
    description: "Assorted cold brew bottles for office teams, birthdays, and weekend gifting.",
    imageUrl: "/brand/aifrogi-logo-transparent.png",
    basePricePaisa: 78000,
    variants: [
      { id: "brew-4", name: "4 bottles", priceDeltaPaisa: 0 },
      { id: "brew-8", name: "8 bottles", priceDeltaPaisa: 68000 },
      { id: "brew-12", name: "12 bottles", priceDeltaPaisa: 128000 }
    ],
    addons: [
      { id: "addon-brownies", name: "Brownie pair", category: "food", pricePaisa: 16000 },
      { id: "addon-cookie-pack", name: "Cookie pack", category: "food", pricePaisa: 22000 }
    ]
  }
];

export const EMILY_CAFE_ORDERS: FlowCartOrder[] = [
  {
    id: "order-emily-1042",
    orderNumber: "FC-1042",
    customerName: "Riya Sharma",
    customerPhone: "+919876543210",
    productName: "Signature Chocolate Cake",
    variantName: "1kg",
    totalPaisa: 145000,
    paymentStatus: "PAID",
    fulfillmentStatus: "PREPARING",
    deliveryDate: "2026-07-07",
    deliverySlot: "6 PM - 8 PM",
    message: "Happy Birthday Aarav"
  },
  {
    id: "order-emily-1043",
    orderNumber: "FC-1043",
    customerName: "Nisha Mehta",
    customerPhone: "+919812345670",
    productName: "Coffee Date Hamper",
    variantName: "Premium",
    totalPaisa: 189000,
    paymentStatus: "PENDING",
    fulfillmentStatus: "NEW",
    deliveryDate: "2026-07-08",
    deliverySlot: "11 AM - 1 PM",
    message: "Congratulations on the new office"
  },
  {
    id: "order-emily-1044",
    orderNumber: "FC-1044",
    customerName: "Aarav Kapoor",
    customerPhone: "+919900112233",
    productName: "Party Snack Platter",
    variantName: "Serves 15",
    totalPaisa: 350000,
    paymentStatus: "PAID",
    fulfillmentStatus: "OUT_FOR_DELIVERY",
    deliveryDate: "2026-07-07",
    deliverySlot: "4 PM - 6 PM",
    message: "No onion in sandwiches"
  }
];

export function formatInrFromPaisa(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Math.round(value / 100));
}
