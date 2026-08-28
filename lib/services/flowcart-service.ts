import crypto from "crypto";
import { Prisma } from "../../generated/prisma/client";
import {
  EMILY_CAFE_ORDERS,
  EMILY_CAFE_PRODUCTS,
  EMILY_CAFE_TENANT,
  type FlowCartAddon,
  type FlowCartOrder,
  type FlowCartProduct,
  type FlowCartVariant
} from "@/lib/flowcart-demo";
import { getDb } from "@/lib/db";

const DEMO_DELIVERY_FEE_PAISA = 9900;
const DEMO_PAYMENT_BASE_URL = "https://rzp.io/i/emily-cafe-demo";

export type FlowCartCreateOrderInput = {
  propertySlug?: string | null;
  customerName: string;
  customerPhone: string;
  productId: string;
  variantId?: string | null;
  addonIds?: string[];
  quantity?: number;
  deliveryDate?: string | null;
  deliverySlot?: string | null;
  deliveryAddress?: {
    line1?: string;
    city?: string;
    pincode?: string;
  } | null;
  message?: string | null;
  notes?: string | null;
};

export type FlowCartMetrics = {
  paidOrders: number;
  pendingPayments: number;
  revenuePaisa: number;
  abandonedCarts: number;
  averageOrderPaisa: number;
};

export type FlowCartWorkspace = {
  tenant: typeof EMILY_CAFE_TENANT & {
    productCount?: number;
    orderCount?: number;
    updatedAtIso?: string;
  };
  products: FlowCartProduct[];
  orders: FlowCartOrder[];
  metrics: FlowCartMetrics;
  integrations: Array<{
    name: string;
    status: string;
    copy: string;
  }>;
  workflow: Array<{
    step: string;
    title: string;
    system: string;
  }>;
};

function paisa(value: number) {
  return Math.max(0, Math.round(value));
}

function orderNumber() {
  return `FC-${Math.floor(1000 + Math.random() * 9000)}`;
}

function jsonObject(value: unknown): Prisma.InputJsonValue {
  if (!value || typeof value !== "object") return {};
  return value as Prisma.InputJsonValue;
}

function getDemoMetrics(orders = EMILY_CAFE_ORDERS): FlowCartMetrics {
  const paid = orders.filter((order) => order.paymentStatus === "PAID");
  const pending = orders.filter((order) => order.paymentStatus === "PENDING");
  const revenuePaisa = paid.reduce((sum, order) => sum + order.totalPaisa, 0);
  return {
    paidOrders: paid.length,
    pendingPayments: pending.length,
    revenuePaisa,
    abandonedCarts: 7,
    averageOrderPaisa: paid.length ? Math.round(revenuePaisa / paid.length) : 0
  };
}

function getDemoIntegrations() {
  return [
    {
      name: "Meta WhatsApp",
      status: "Flow ready",
      copy: "Category, product, customization, and address capture."
    },
    {
      name: "Razorpay",
      status: "Payment link",
      copy: "Advance or full payment before kitchen confirmation."
    },
    {
      name: "Store connector",
      status: "Demo catalog",
      copy: "Can switch to Shopify, WooCommerce, custom API, or Google Sheet."
    },
    {
      name: "Merchant dashboard",
      status: "Live orders",
      copy: "Paid, pending, preparing, delivery, and customer timeline."
    }
  ];
}

function getWorkflow() {
  return [
    { step: "1", title: "Customer starts on WhatsApp", system: "Meta Cloud API" },
    { step: "2", title: "Flow collects custom order", system: "WhatsApp Flow" },
    { step: "3", title: "Catalog and price are checked", system: "FlowCart engine" },
    { step: "4", title: "Payment link is created", system: "Razorpay" },
    { step: "5", title: "Order syncs to store/dashboard", system: "Connector" },
    { step: "6", title: "Updates are sent automatically", system: "WhatsApp templates" }
  ];
}

function getDemoTenantSummary() {
  return {
    ...EMILY_CAFE_TENANT,
    productCount: EMILY_CAFE_PRODUCTS.length,
    orderCount: EMILY_CAFE_ORDERS.length,
    updatedAtIso: new Date().toISOString()
  };
}

function getDemoWorkspace(): FlowCartWorkspace {
  return {
    tenant: getDemoTenantSummary(),
    products: EMILY_CAFE_PRODUCTS,
    orders: EMILY_CAFE_ORDERS,
    metrics: getDemoMetrics(),
    integrations: getDemoIntegrations(),
    workflow: getWorkflow()
  };
}

export function calculateDemoOrder(input: FlowCartCreateOrderInput) {
  const product = EMILY_CAFE_PRODUCTS.find((item) => item.id === input.productId) || EMILY_CAFE_PRODUCTS[0];
  const variant = product.variants.find((item) => item.id === input.variantId) || product.variants[0];
  const addons = product.addons.filter((addon) => input.addonIds?.includes(addon.id));
  const quantity = Math.max(1, Number(input.quantity) || 1);
  const addonTotalPaisa = addons.reduce((sum, addon) => sum + addon.pricePaisa, 0);
  const unitPricePaisa = paisa(product.basePricePaisa + (variant?.priceDeltaPaisa || 0));
  const subtotalPaisa = paisa((unitPricePaisa + addonTotalPaisa) * quantity);
  const deliveryFeePaisa = input.deliveryAddress?.line1 ? DEMO_DELIVERY_FEE_PAISA : 0;
  const totalPaisa = subtotalPaisa + deliveryFeePaisa;

  return {
    product,
    variant,
    addons,
    quantity,
    unitPricePaisa,
    addonTotalPaisa,
    subtotalPaisa,
    deliveryFeePaisa,
    totalPaisa
  };
}

function mapDbProduct(product: {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string | null;
  basePricePaisa: number;
  variants: Array<{ id: string; name: string; priceDeltaPaisa: number }>;
  addons: Array<{ id: string; name: string; category: string; pricePaisa: number }>;
}): FlowCartProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    imageUrl: product.imageUrl || "/brand/aifrogi-logo-transparent.png",
    basePricePaisa: product.basePricePaisa,
    variants: product.variants.map((variant): FlowCartVariant => ({
      id: variant.id,
      name: variant.name,
      priceDeltaPaisa: variant.priceDeltaPaisa
    })),
    addons: product.addons.map((addon): FlowCartAddon => ({
      id: addon.id,
      name: addon.name,
      category: addon.category,
      pricePaisa: addon.pricePaisa
    }))
  };
}

function mapDbOrder(order: {
  id: string;
  orderNumber: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalPaisa: number;
  deliveryDate: Date | null;
  deliverySlot: string | null;
  customization: Prisma.JsonValue | null;
  customer: { name: string | null; phone: string } | null;
  items: Array<{ title: string; variantTitle: string | null }>;
}): FlowCartOrder {
  const customization = order.customization && typeof order.customization === "object" && !Array.isArray(order.customization)
    ? order.customization as Record<string, unknown>
    : {};

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer?.name || "WhatsApp Customer",
    customerPhone: order.customer?.phone || "",
    productName: order.items[0]?.title || "Custom order",
    variantName: order.items[0]?.variantTitle || "Standard",
    totalPaisa: order.totalPaisa,
    paymentStatus: order.paymentStatus as FlowCartOrder["paymentStatus"],
    fulfillmentStatus: order.fulfillmentStatus as FlowCartOrder["fulfillmentStatus"],
    deliveryDate: order.deliveryDate?.toISOString().slice(0, 10) || "",
    deliverySlot: order.deliverySlot || "",
    message: typeof customization.message === "string" ? customization.message : ""
  };
}

export async function getOrCreateFlowCartTenantForProperty(propertySlug = "hotelradar") {
  const db = getDb();
  if (!db) {
    return {
      error: null,
      status: 200 as const,
      tenant: getDemoTenantSummary()
    };
  }

  try {
    const property = await db.property.findUnique({
      where: { slug: propertySlug },
      select: { id: true, name: true, slug: true, timezone: true }
    });
    if (!property) return { error: "Workspace not found.", status: 404 as const, tenant: null };

    const tenant = await db.$transaction(async (tx) => {
      const existing = await tx.commerceTenant.findUnique({
        where: { propertyId: property.id },
        include: { _count: { select: { products: true, orders: true } } }
      });
      if (existing) return existing;

      const created = await tx.commerceTenant.create({
        data: {
          propertyId: property.id,
          aifrogiTenantId: `${property.slug}-flowcart`,
          name: "FlowCart Commerce",
          brandName: "Emily Cafe",
          timezone: property.timezone || "Asia/Kolkata",
          currency: "INR",
          storeProvider: "DEMO",
          razorpayEnabled: false,
          whatsappFlowId: "flow_emily_cafe_order_v1",
          fulfillmentModes: ["pickup", "delivery"],
          settings: { demoNiche: "cafe-cakes-gifts" }
        }
      });

      for (const product of EMILY_CAFE_PRODUCTS) {
        await tx.commerceProduct.create({
          data: {
            tenantId: created.id,
            externalId: product.id,
            name: product.name,
            slug: product.slug,
            category: product.category,
            description: product.description,
            imageUrl: product.imageUrl,
            basePricePaisa: product.basePricePaisa,
            sortOrder: EMILY_CAFE_PRODUCTS.indexOf(product) + 1,
            variants: {
              create: product.variants.map((variant, index) => ({
                externalId: variant.id,
                name: variant.name,
                priceDeltaPaisa: variant.priceDeltaPaisa,
                sortOrder: index + 1
              }))
            },
            addons: {
              create: product.addons.map((addon, index) => ({
                tenantId: created.id,
                name: addon.name,
                category: addon.category,
                pricePaisa: addon.pricePaisa,
                sortOrder: index + 1
              }))
            }
          }
        });
      }

      return tx.commerceTenant.findUniqueOrThrow({
        where: { id: created.id },
        include: { _count: { select: { products: true, orders: true } } }
      });
    });

    return {
      error: null,
      status: 200 as const,
      tenant: {
        id: tenant.id,
        aifrogiTenantId: tenant.aifrogiTenantId,
        name: tenant.name,
        brandName: tenant.brandName,
        status: tenant.status,
        timezone: tenant.timezone,
        currency: tenant.currency,
        storeProvider: tenant.storeProvider,
        razorpayEnabled: tenant.razorpayEnabled,
        whatsappFlowId: tenant.whatsappFlowId || EMILY_CAFE_TENANT.whatsappFlowId,
        fulfillmentModes: tenant.fulfillmentModes,
        productCount: tenant._count.products,
        orderCount: tenant._count.orders,
        updatedAtIso: tenant.updatedAt.toISOString()
      }
    };
  } catch {
    return {
      error: null,
      status: 200 as const,
      tenant: getDemoTenantSummary()
    };
  }
}

export async function getFlowCartWorkspace(propertySlug = "hotelradar"): Promise<FlowCartWorkspace> {
  const db = getDb();
  if (!db) return getDemoWorkspace();

  const tenantResult = await getOrCreateFlowCartTenantForProperty(propertySlug);
  if (!tenantResult.tenant) {
    return getDemoWorkspace();
  }

  try {
    const [products, orders] = await Promise.all([
      db.commerceProduct.findMany({
        where: { tenantId: tenantResult.tenant.id, active: true },
        include: {
          variants: { where: { active: true }, orderBy: { sortOrder: "asc" } },
          addons: { where: { active: true }, orderBy: { sortOrder: "asc" } }
        },
        orderBy: { sortOrder: "asc" }
      }),
      db.commerceOrder.findMany({
        where: { tenantId: tenantResult.tenant.id },
        include: { customer: true, items: true },
        orderBy: { createdAt: "desc" },
        take: 12
      })
    ]);

    const mappedOrders = orders.map(mapDbOrder);
    return {
      tenant: tenantResult.tenant,
      products: products.map(mapDbProduct),
      orders: mappedOrders.length ? mappedOrders : EMILY_CAFE_ORDERS,
      metrics: getDemoMetrics(mappedOrders.length ? mappedOrders : EMILY_CAFE_ORDERS),
      integrations: getDemoIntegrations(),
      workflow: getWorkflow()
    };
  } catch {
    return getDemoWorkspace();
  }
}

export async function createFlowCartOrder(input: FlowCartCreateOrderInput) {
  const pricing = calculateDemoOrder(input);
  const db = getDb();
  const newOrderNumber = orderNumber();
  const paymentLinkUrl = `${DEMO_PAYMENT_BASE_URL}?order=${newOrderNumber}`;

  if (!db) {
    const order: FlowCartOrder = {
      id: `demo-${newOrderNumber.toLowerCase()}`,
      orderNumber: newOrderNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      productName: pricing.product.name,
      variantName: pricing.variant?.name || "Standard",
      totalPaisa: pricing.totalPaisa,
      paymentStatus: "PENDING",
      fulfillmentStatus: "NEW",
      deliveryDate: input.deliveryDate || "",
      deliverySlot: input.deliverySlot || "",
      message: input.message || ""
    };

    return {
      error: null,
      status: 201 as const,
      order,
      paymentLink: {
        provider: "RAZORPAY",
        id: `plink_demo_${newOrderNumber.toLowerCase()}`,
        url: paymentLinkUrl,
        amountPaisa: pricing.totalPaisa
      },
      whatsappReply: `Emily Cafe order ${newOrderNumber} is ready. Pay to confirm: ${paymentLinkUrl}`
    };
  }

  const propertySlug = input.propertySlug || "hotelradar";
  const tenantResult = await getOrCreateFlowCartTenantForProperty(propertySlug);
  if (!tenantResult.tenant) return { error: tenantResult.error || "FlowCart tenant unavailable.", status: tenantResult.status, order: null };

  const tenantId = tenantResult.tenant.id;
  try {
    const customer = await db.commerceCustomer.upsert({
      where: { tenantId_phone: { tenantId, phone: input.customerPhone } },
      update: {
        name: input.customerName,
        lastAddress: jsonObject(input.deliveryAddress)
      },
      create: {
        tenantId,
        phone: input.customerPhone,
        name: input.customerName,
        lastAddress: jsonObject(input.deliveryAddress),
        tags: ["flowcart"]
      }
    });

    const dbProduct = await db.commerceProduct.findFirst({
      where: {
        tenantId,
        OR: [{ id: input.productId }, { externalId: input.productId }]
      },
      include: { variants: true, addons: true }
    });

    const selectedVariant = dbProduct?.variants.find((variant) => variant.id === input.variantId || variant.externalId === input.variantId);

    const deliveryDate = input.deliveryDate ? new Date(input.deliveryDate) : null;
    const order = await db.commerceOrder.create({
      data: {
        tenantId,
        customerId: customer.id,
        orderNumber: newOrderNumber,
        status: "CONFIRMATION_PENDING",
        paymentStatus: "PENDING",
        fulfillmentStatus: "NEW",
        subtotalPaisa: pricing.subtotalPaisa,
        deliveryFeePaisa: pricing.deliveryFeePaisa,
        totalPaisa: pricing.totalPaisa,
        currency: "INR",
        deliveryDate,
        deliverySlot: input.deliverySlot,
        deliveryAddress: jsonObject(input.deliveryAddress),
        customization: jsonObject({
          message: input.message,
          notes: input.notes,
          addonIds: input.addonIds || []
        }),
        notes: input.notes,
        paymentLinkId: `plink_demo_${newOrderNumber.toLowerCase()}`,
        paymentLinkUrl,
        items: {
          create: {
            productId: dbProduct?.id,
            variantId: selectedVariant?.id,
            title: dbProduct?.name || pricing.product.name,
            variantTitle: selectedVariant?.name || pricing.variant?.name,
            quantity: pricing.quantity,
            unitPricePaisa: pricing.unitPricePaisa,
            addonTotalPaisa: pricing.addonTotalPaisa,
            totalPaisa: pricing.subtotalPaisa,
            customization: jsonObject({ addonIds: input.addonIds || [] })
          }
        },
        payments: {
          create: {
            tenantId,
            provider: "RAZORPAY",
            paymentLinkId: `plink_demo_${newOrderNumber.toLowerCase()}`,
            amountPaisa: pricing.totalPaisa,
            status: "PENDING"
          }
        }
      },
      include: { customer: true, items: true }
    });

    return {
      error: null,
      status: 201 as const,
      order: mapDbOrder(order),
      paymentLink: {
        provider: "RAZORPAY",
        id: order.paymentLinkId,
        url: paymentLinkUrl,
        amountPaisa: pricing.totalPaisa
      },
      whatsappReply: `Emily Cafe order ${newOrderNumber} is ready. Pay to confirm: ${paymentLinkUrl}`
    };
  } catch {
    const order: FlowCartOrder = {
      id: `demo-${newOrderNumber.toLowerCase()}`,
      orderNumber: newOrderNumber,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      productName: pricing.product.name,
      variantName: pricing.variant?.name || "Standard",
      totalPaisa: pricing.totalPaisa,
      paymentStatus: "PENDING",
      fulfillmentStatus: "NEW",
      deliveryDate: input.deliveryDate || "",
      deliverySlot: input.deliverySlot || "",
      message: input.message || ""
    };

    return {
      error: null,
      status: 201 as const,
      order,
      paymentLink: {
          provider: "RAZORPAY",
          id: `plink_demo_${newOrderNumber.toLowerCase()}`,
          url: paymentLinkUrl,
          amountPaisa: pricing.totalPaisa
      },
      whatsappReply: `Emily Cafe order ${newOrderNumber} is ready. Pay to confirm: ${paymentLinkUrl}`
    };
  }
}

export async function markFlowCartPaymentPaid(input: {
  paymentLinkId: string;
  externalPaymentId?: string | null;
  rawPayload?: unknown;
}) {
  const db = getDb();
  if (!db) {
    return {
      error: null,
      status: 200 as const,
      result: {
        paymentLinkId: input.paymentLinkId,
        paymentStatus: "PAID",
        orderStatus: "CONFIRMED"
      }
    };
  }

  const payment = await db.commercePayment.findUnique({
    where: { paymentLinkId: input.paymentLinkId },
    select: { id: true, orderId: true }
  });
  if (!payment) return { error: "Payment link not found.", status: 404 as const, result: null };

  await db.$transaction([
    db.commercePayment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        externalPaymentId: input.externalPaymentId || undefined,
        rawPayload: input.rawPayload as Prisma.InputJsonValue
      }
    }),
    db.commerceOrder.update({
      where: { id: payment.orderId },
      data: {
        status: "CONFIRMED",
        paymentStatus: "PAID"
      }
    })
  ]);

  return {
    error: null,
    status: 200 as const,
    result: {
      paymentLinkId: input.paymentLinkId,
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED"
    }
  };
}

export function verifyRazorpayWebhookSignature(input: {
  rawBody: string;
  signatureHeader?: string | null;
  secret?: string | null;
}) {
  if (!input.secret) return { ok: true as const };
  if (!input.signatureHeader) return { ok: false as const, error: "Missing Razorpay signature.", status: 401 as const };

  const expected = crypto.createHmac("sha256", input.secret).update(input.rawBody).digest("hex");
  const received = input.signatureHeader;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    return { ok: false as const, error: "Invalid Razorpay signature.", status: 401 as const };
  }
  return { ok: true as const };
}
