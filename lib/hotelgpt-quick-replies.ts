export type HotelGuestJourney = "PRE_STAY" | "IN_STAY";
export type HotelReplyStatus = "RECEIVED" | "ASSIGNED" | "ON_THE_WAY" | "DELAYED" | "INFORMATION_REQUIRED" | "COMPLETED" | "GUEST_UNAVAILABLE" | "ESCALATED" | "FEEDBACK";
export type HotelReplyRole = "OWNER" | "ADMIN" | "AGENT";
export type HotelReplyMode = "AUTOMATIC" | "STAFF_TRIGGERED";

export type HotelQuickReply = {
  id: string;
  masterId: string;
  version: number;
  journey: HotelGuestJourney;
  department: string;
  requestCategory: string;
  status: HotelReplyStatus;
  label: string;
  message: string;
  permittedRoles: HotelReplyRole[];
  mode: HotelReplyMode;
  enabled: boolean;
  languageVariants: Record<string, string>;
};

const staff = ["OWNER", "ADMIN", "AGENT"] as HotelReplyRole[];
const reply = (id: string, journey: HotelGuestJourney, department: string, status: HotelReplyStatus, label: string, message: string, requestCategory = "ALL"): HotelQuickReply => ({ id, masterId:id, version:1, journey, department, requestCategory, status, label, message, permittedRoles:staff, mode:"STAFF_TRIGGERED", enabled:true, languageVariants:{} });

export const HOTELGPT_MASTER_QUICK_REPLIES: HotelQuickReply[] = [
  reply("pre-received","PRE_STAY","Reservations","RECEIVED","Enquiry received","Thank you for your enquiry. Our reservations team has received it and will reply here."),
  reply("pre-info","PRE_STAY","Reservations","INFORMATION_REQUIRED","Ask for details","Please share your preferred dates and number of guests so our reservations team can assist."),
  reply("pre-assigned","PRE_STAY","Reservations","ASSIGNED","Reservations reviewing","Our reservations team is reviewing your enquiry and will update you here."),
  reply("pre-delayed","PRE_STAY","Reservations","DELAYED","Response delayed","Thank you for your patience. We need a little more time to confirm the requested information."),
  reply("pre-escalated","PRE_STAY","Front Desk","ESCALATED","Manager review","We have asked a hotel manager to review your enquiry and reply here."),
];

const journeys = new Set(["PRE_STAY","IN_STAY"]);
const statuses = new Set(["RECEIVED","ASSIGNED","ON_THE_WAY","DELAYED","INFORMATION_REQUIRED","COMPLETED","GUEST_UNAVAILABLE","ESCALATED","FEEDBACK"]);
const roles = new Set(["OWNER","ADMIN","AGENT"]);
export function normalizeHotelQuickReply(value: unknown): HotelQuickReply | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source=value as Record<string,unknown>; const journey=String(source.journey); const status=String(source.status);
  const message=String(source.message||"").trim().slice(0,1000); const label=String(source.label||"").trim().slice(0,60);
  if(!journeys.has(journey)||!statuses.has(status)||!message||!label)return null;
  const cleanId=String(source.id||crypto.randomUUID()).replace(/[^a-z0-9_-]/gi,"").slice(0,80)||crypto.randomUUID();
  const variants=source.languageVariants&&typeof source.languageVariants==="object"&&!Array.isArray(source.languageVariants)?Object.fromEntries(Object.entries(source.languageVariants as Record<string,unknown>).slice(0,8).map(([key,text])=>[key.slice(0,20),String(text).trim().slice(0,1000)]).filter(([,text])=>text)):{};
  return {id:cleanId,masterId:String(source.masterId||cleanId).replace(/[^a-z0-9_-]/gi,"").slice(0,80)||cleanId,version:Math.max(1,Number(source.version)||1),journey:journey as HotelGuestJourney,department:String(source.department||"ALL").trim().slice(0,80)||"ALL",requestCategory:String(source.requestCategory||"ALL").trim().slice(0,80)||"ALL",status:status as HotelReplyStatus,label,message,permittedRoles:Array.isArray(source.permittedRoles)?source.permittedRoles.map(String).filter(item=>roles.has(item)) as HotelReplyRole[]:staff,mode:source.mode==="AUTOMATIC"?"AUTOMATIC":"STAFF_TRIGGERED",enabled:source.enabled!==false,languageVariants:variants};
}

export function installHotelQuickReplyDefaults(){return HOTELGPT_MASTER_QUICK_REPLIES.map(item=>({...item,id:crypto.randomUUID(),languageVariants:{...item.languageVariants}}));}
