export type DashboardMode = 'whatsapp' | 'ai';

export type LeadStatus = 'New' | 'Follow-up' | 'Confirmed' | 'Pending';

export type LeadAction = 'Call' | 'Convert' | 'Delete';

export type LeadMessage = {
  id: string;
  from: 'guest' | 'agent' | 'ai';
  text: string;
  time: string;
  sentAtIso: string;
  status?: string | null;
  attachment?: {
    kind: 'image' | 'file';
    url: string;
    name: string;
  } | null;
};

export type LeadRecord = {
  id: string;
  propertyId?: string;
  propertySlug?: string;
  name: string;
  intent: string;
  status: LeadStatus;
  lastAction: string;
  value: number;
  updatedAtLabel: string;
  updatedAtIso: string;
  unread: number;
  channel: string;
  phone: string;
  source: string;
  transcript: LeadMessage[];
};
