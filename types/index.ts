import type { ReactNode } from "react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: string;
  tone?: "primary" | "secondary" | "tertiary" | "neutral" | "error";
};

export type Metric = {
  label: string;
  value: string;
  delta?: string;
  tone?: "primary" | "secondary" | "tertiary" | "neutral" | "error";
  helper?: string;
  trend?: number[];
};

export type Lead = {
  id: string;
  propertyId?: string;
  propertySlug?: string;
  name: string;
  initials: string;
  score: number;
  isHighPriority?: boolean;
  source: string;
  stage: string;
  minutesAgo: number;
  language: "HI" | "EN";
  intent: string;
  stay: string;
  party: string;
  budget: string;
  phone: string;
  updatedAtLabel: string;
  updatedAtIso: string;
  tags: string[];
  transcript: Array<{
    id: string;
    from: "guest" | "agent" | "ai";
    text: string;
    time: string;
    sentAtIso: string;
    status?: string | null;
    attachment?: {
      kind: "image" | "file";
      url: string;
      name: string;
    } | null;
  }>;
};

export type LeadInput = {
  name: string;
  source: string;
  stage: string;
  language: "HI" | "EN";
  intent: string;
  stay: string;
  party: string;
  budget: string;
  phone: string;
  score: number;
  tags?: string[];
  isHighPriority?: boolean;
};

export type Asset = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  category: string;
  url: string;
  thumbnailUrl?: string | null;
  tags: string[];
  isActive: boolean;
  updatedAtLabel: string;
};

export type AssetShare = {
  id: string;
  leadId: string;
  assetId: string;
  assetTitle: string;
  assetType: string;
  assetUrl: string;
  channel: string;
  note?: string | null;
  sharedAtLabel: string;
};

export type AssetInput = {
  title: string;
  description?: string;
  type: string;
  category: string;
  url: string;
  thumbnailUrl?: string;
  tags?: string[];
};

export type WhatsAppIntegration = {
  id: string;
  provider: string;
  businessAccountId?: string | null;
  phoneNumberId?: string | null;
  displayPhoneNumber?: string | null;
  webhookVerifyToken?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAtLabel?: string | null;
  lastValidatedAtLabel?: string | null;
  notes?: string | null;
  aiModeEnabled: boolean;
};

export type WhatsAppIntegrationInput = {
  provider: string;
  businessAccountId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  webhookVerifyToken?: string;
  accessToken?: string;
  notes?: string;
  approvedBy?: string;
  aiModeEnabled?: boolean;
};

export type FestivalItem = {
  name: string;
  startLabel: string;
  status: string;
  accent: "tertiary" | "secondary" | "primary";
};

export type QuickAction = {
  label: string;
  icon: string;
  tone?: "primary" | "neutral" | "error";
};

export type RouteCard = {
  title: string;
  description: string;
  href: string;
  eyebrow: string;
  preview?: ReactNode;
};

export type MailboxFolderId = "inbox" | "sent" | "drafts" | "spam" | "trash";

export type MailboxMessage = {
  id: string;
  folder: MailboxFolderId;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  sentAtIso: string;
  sentAtLabel: string;
  unread: boolean;
  starred: boolean;
  hasAttachments: boolean;
};

export type MailboxStats = {
  emailCount: number;
  responseCount: number;
  responseTimeLabel: string;
  receivedCount: number;
  sentCount: number;
  unreadCount: number;
  starredCount: number;
  updatedAtLabel: string;
};

export type MailboxSummary = {
  configured: boolean;
  emailAddress: string;
  messages: MailboxMessage[];
  stats: MailboxStats;
  folders: Array<{
    id: MailboxFolderId;
    label: string;
    count: number;
  }>;
};

export type LeadHealthStatus = "new" | "responded" | "missed" | "delayed" | "unresponded";

export type LeadTier = "HOT" | "WARM" | "COLD";

export type RevenueAction = {
  title: string;
  reason: string;
  revenueImpact: number;
  revenueImpactLabel: string;
  priority: "high" | "medium" | "low";
};

export type RecoveryLead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: string;
  score: number;
  tier: LeadTier;
  healthStatus: LeadHealthStatus;
  issue: string;
  nextStep: string;
  revenuePotential: number;
  revenuePotentialLabel: string;
  lastActivityLabel: string;
  updatedAtIso: string;
};

export type FunnelPoint = {
  label: string;
  value: number;
  percentage: number;
};

export type DemandPoint = {
  label: string;
  leads: number;
  revenue: number;
};

export type DashboardIntelligence = {
  summary: {
    totalLeads: number;
    missedLeads: number;
    delayedLeads: number;
    unrespondedLeads: number;
    emailBacklog: number;
    attentionNeeded: number;
    hotLeads: number;
    convertedLeads: number;
    revenueAtRisk: number;
    averageResponseLabel: string;
    responseLagLabel: string;
  };
  actions: RevenueAction[];
  recovery: RecoveryLead[];
  funnel: FunnelPoint[];
  demand: DemandPoint[];
  liveFeed: Lead[];
};
