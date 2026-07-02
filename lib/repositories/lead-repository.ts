import { getDb } from "@/lib/db";

export async function getLeadsForProperty(propertySlug: string) {
  const db = getDb();
  if (!db) return null;

  return db.lead.findMany({
    where: {
      property: {
        slug: propertySlug
      }
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    },
    orderBy: [{ score: "desc" }, { lastActivityAt: "desc" }]
  });
}

export async function getLeadById(id: string) {
  const db = getDb();
  if (!db) return null;

  return db.lead.findUnique({
    where: { id },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    }
  });
}

export async function getLeadByPhoneForProperty(propertyId: string, phone: string) {
  const db = getDb();
  if (!db) return null;

  return db.lead.findUnique({
    where: {
      propertyId_phone: {
        propertyId,
        phone
      }
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    }
  });
}

export async function getLeadByExternalMessageId(externalMessageId: string) {
  const db = getDb();
  if (!db) return null;

  const message = await db.leadMessage.findUnique({
    where: { externalMessageId },
    include: {
      lead: {
        include: {
          property: {
            select: {
              id: true,
              slug: true
            }
          },
          tags: true,
          messages: {
            orderBy: {
              sentAt: "asc"
            }
          }
        }
      }
    }
  });

  return message?.lead ?? null;
}

export async function createLeadForProperty(
  propertyId: string,
  input: {
    name: string;
    initials: string;
    score: number;
    source: string;
    stage: Parameters<NonNullable<ReturnType<typeof getDb>>["lead"]["create"]>[0]["data"]["stage"];
    language: Parameters<NonNullable<ReturnType<typeof getDb>>["lead"]["create"]>[0]["data"]["language"];
    intent: string;
    stayLabel: string;
    partyLabel: string;
    budgetLabel: string;
    phone: string;
    tags: string[];
    isHighPriority: boolean;
  }
) {
  const db = getDb();
  if (!db) return null;

  return db.lead.create({
    data: {
      propertyId,
      name: input.name,
      initials: input.initials,
      score: input.score,
      source: input.source,
      stage: input.stage,
      language: input.language,
      intent: input.intent,
      stayLabel: input.stayLabel,
      partyLabel: input.partyLabel,
      budgetLabel: input.budgetLabel,
      phone: input.phone,
      isHighPriority: input.isHighPriority,
      lastActivityAt: new Date(),
      tags: {
        create: input.tags.map((value) => ({ value }))
      }
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    }
  });
}

export async function updateLeadById(
  id: string,
  input: {
    name: string;
    initials: string;
    score: number;
    source: string;
    stage: Parameters<NonNullable<ReturnType<typeof getDb>>["lead"]["update"]>[0]["data"]["stage"];
    language: Parameters<NonNullable<ReturnType<typeof getDb>>["lead"]["update"]>[0]["data"]["language"];
    intent: string;
    stayLabel: string;
    partyLabel: string;
    budgetLabel: string;
    phone: string;
    tags: string[];
    isHighPriority: boolean;
  }
) {
  const db = getDb();
  if (!db) return null;

  await db.leadTag.deleteMany({
    where: {
      leadId: id
    }
  });

  return db.lead.update({
    where: { id },
    data: {
      name: input.name,
      initials: input.initials,
      score: input.score,
      source: input.source,
      stage: input.stage,
      language: input.language,
      intent: input.intent,
      stayLabel: input.stayLabel,
      partyLabel: input.partyLabel,
      budgetLabel: input.budgetLabel,
      phone: input.phone,
      isHighPriority: input.isHighPriority,
      tags: {
        create: input.tags.map((value) => ({ value }))
      }
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    }
  });
}

export async function appendMessageToLead(
  leadId: string,
  input: {
    sender: Parameters<NonNullable<ReturnType<typeof getDb>>["leadMessage"]["create"]>[0]["data"]["sender"];
    body: string;
    sentAt: Date;
    externalMessageId?: string;
    deliveryStatus?: string;
  }
) {
  const db = getDb();
  if (!db) return null;

  const messageData = {
      leadId,
      sender: input.sender,
      body: input.body,
      externalMessageId: input.externalMessageId,
      deliveryStatus: input.deliveryStatus,
      statusUpdatedAt: input.deliveryStatus ? new Date() : null,
      sentAt: input.sentAt
  };

  const existingMessage = await db.leadMessage.findFirst({
    where: messageData
  });

  if (!existingMessage) {
    await db.leadMessage.create({
      data: messageData
    });
  }

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: {
      lastActivityAt: true
    }
  });

  return db.lead.update({
    where: { id: leadId },
    data: {
      lastActivityAt:
        !lead || input.sentAt.getTime() > lead.lastActivityAt.getTime()
          ? input.sentAt
          : lead.lastActivityAt
    },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    }
  });
}

export async function updateLeadMessageStatusByExternalId(
  externalMessageId: string,
  input: {
    deliveryStatus: string;
    statusUpdatedAt: Date;
  }
) {
  const db = getDb();
  if (!db) return null;

  const message = await db.leadMessage.findUnique({
    where: { externalMessageId },
    select: { leadId: true }
  });

  if (!message) {
    return null;
  }

  await db.leadMessage.update({
    where: { externalMessageId },
    data: {
      deliveryStatus: input.deliveryStatus,
      statusUpdatedAt: input.statusUpdatedAt
    }
  });

  return db.lead.findUnique({
    where: { id: message.leadId },
    include: {
      property: {
        select: {
          id: true,
          slug: true
        }
      },
      tags: true,
      messages: {
        orderBy: {
          sentAt: "asc"
        }
      }
    }
  });
}
