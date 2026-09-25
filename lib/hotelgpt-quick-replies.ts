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
  reply("stay-received","IN_STAY","ALL","RECEIVED","Request received","We have received your request. The front desk will update you here.","ALL"),
  reply("stay-assigned-frontdesk","IN_STAY","Front Desk","ASSIGNED","Front desk assigned","The front desk has accepted your request and will keep you updated here."),
  reply("stay-assigned-housekeeping","IN_STAY","Housekeeping","ASSIGNED","Housekeeping assigned","Housekeeping has accepted your request and will update you here."),
  reply("stay-assigned-maintenance","IN_STAY","Maintenance","ASSIGNED","Maintenance assigned","Maintenance has accepted your request and will update you here."),
  reply("stay-assigned-food","IN_STAY","Food & Beverage","ASSIGNED","Food & Beverage assigned","Food & Beverage has accepted your request and will update you here."),
  reply("stay-on-way","IN_STAY","ALL","ON_THE_WAY","Team on the way","Our team is on the way to your room."),
  reply("stay-delayed","IN_STAY","ALL","DELAYED","Apologise for delay","We are sorry for the delay. Your request remains open and we will update you here."),
  reply("stay-info","IN_STAY","ALL","INFORMATION_REQUIRED","Ask for details","Please share a little more detail so the hotel team can help with your request."),
  reply("stay-unavailable","IN_STAY","ALL","GUEST_UNAVAILABLE","Guest unavailable","Our team visited your room but could not reach you. Please tell us when you are available."),
  reply("stay-escalated","IN_STAY","Front Desk","ESCALATED","Escalated to manager","Your request has been escalated to the duty manager for review."),
  reply("stay-completed","IN_STAY","ALL","COMPLETED","Resolve and confirm","Your request has been completed. Please let us know if you need any further help."),
  reply("stay-feedback","IN_STAY","ALL","FEEDBACK","Request feedback","Was everything resolved to your satisfaction?"),
  reply("stay-safety","IN_STAY","Front Desk","ESCALATED","Urgent review","The front desk has escalated this for urgent review. If there is immediate danger, please call the hotel emergency number."),
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
