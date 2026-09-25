import type { TenantFlowDefinition, TenantFlowTemplateKey } from "@/lib/tenant-flow-intelligence";

export type HotelFlowJourney = "PRE_STAY" | "IN_STAY";
export type HotelFlowAccess = "PUBLIC" | "VERIFIED_STAY";
export type HotelSmartOutput = "QUICK_REPLIES" | "CONTENT_CARD" | "COMPARISON" | "BOOKING_ACTION" | "ARRIVAL_SUMMARY" | "SERVICE_STATUS" | "RESOLUTION_TIMELINE" | "FEEDBACK" | "HUMAN_HANDOVER";

export type HotelFlowTemplate = {
  id: string;
  version: number;
  key: TenantFlowTemplateKey;
  name: string;
  journey: HotelFlowJourney;
  access: HotelFlowAccess;
  menuLabel: string;
  openingQuestion: string;
  description: string;
  intentTerms: string[];
  requiredKnowledge: string[];
  requiredConnector: string | null;
  department: string | null;
  smartOutputs: HotelSmartOutput[];
  stages: string[];
};

export const HOTELGPT_FLOW_LIBRARY_VERSION = 1;

export const HOTELGPT_FLOW_LIBRARY: readonly HotelFlowTemplate[] = [
  { id:"hotel-pre-discover",version:1,key:"HOTEL_DISCOVER",name:"Discover hotel",journey:"PRE_STAY",access:"PUBLIC",menuLabel:"Discover the hotel",openingQuestion:"Please help me discover the hotel, its character and the experiences it offers.",description:"Turns broad exploration into concise approved highlights and relevant next choices.",intentTerms:["discover","about hotel","tell me about","highlights","facilities","amenities","experience"],requiredKnowledge:["Hotel identity","Facilities and highlights","Location","Experiences"],requiredConnector:null,department:"Reservations",smartOutputs:["CONTENT_CARD","QUICK_REPLIES","HUMAN_HANDOVER"],stages:["Understand interest","Answer from approved content","Offer relevant choices","Continue or hand over"] },
  { id:"hotel-pre-find-stay",version:1,key:"HOTEL_FIND_STAY",name:"Find a stay",journey:"PRE_STAY",access:"PUBLIC",menuLabel:"Find a stay",openingQuestion:"Help me find the right stay. I can share my destination, dates and number of guests.",description:"Collects only missing stay details and uses verified availability or an approved booking link.",intentTerms:["find a stay","room","rooms","availability","available","book","booking","reserve","rate","price"],requiredKnowledge:["Properties or room types","Occupancy","Published rates","Booking policy"],requiredConnector:"Optional verified availability/PMS read connector",department:"Reservations",smartOutputs:["CONTENT_CARD","COMPARISON","BOOKING_ACTION","QUICK_REPLIES","HUMAN_HANDOVER"],stages:["Understand stay need","Collect missing dates and occupancy","Present verified options","Book or contact reservations"] },
  { id:"hotel-pre-arrival",version:1,key:"HOTEL_PLAN_ARRIVAL",name:"Plan arrival",journey:"PRE_STAY",access:"PUBLIC",menuLabel:"Plan my arrival",openingQuestion:"Help me plan my arrival, including check-in, directions, transport or an early-arrival request.",description:"Provides approved arrival guidance and routes special requests to the hotel.",intentTerms:["arrival","arrive","check in","check-in","early check","directions","transport","transfer","pickup","airport","railway"],requiredKnowledge:["Check-in policy","Directions","Transport options","Early-arrival policy"],requiredConnector:null,department:"Front Desk",smartOutputs:["ARRIVAL_SUMMARY","QUICK_REPLIES","HUMAN_HANDOVER"],stages:["Identify arrival need","Answer approved guidance","Summarise next steps","Route special request"] },
  { id:"hotel-stay-service",version:1,key:"HOTEL_SERVICE_REQUEST",name:"Request hotel service",journey:"IN_STAY",access:"VERIFIED_STAY",menuLabel:"Request hotel service",openingQuestion:"I need a hotel service for my room.",description:"Uses the verified room, identifies the service and routes it to the right department.",intentTerms:["towel","clean","housekeeping","toiletries","water","food","tea","coffee","luggage","service","request"],requiredKnowledge:["Available guest services","Service hours","Department routing"],requiredConnector:null,department:"AUTO_ROUTE",smartOutputs:["QUICK_REPLIES","SERVICE_STATUS","RESOLUTION_TIMELINE","HUMAN_HANDOVER"],stages:["Use verified room","Identify service","Route department","Track resolution"] },
  { id:"hotel-stay-problem",version:1,key:"HOTEL_REPORT_PROBLEM",name:"Report a problem",journey:"IN_STAY",access:"VERIFIED_STAY",menuLabel:"Report a problem",openingQuestion:"I need to report a problem with my room or stay.",description:"Captures a concise issue and urgency, then starts a human-owned complaint journey.",intentTerms:["problem","complaint","broken","not working","dirty","noise","unsafe","leak","no water","no power","ac"],requiredKnowledge:["Emergency guidance","Complaint routing","Escalation contacts"],requiredConnector:null,department:"AUTO_ROUTE",smartOutputs:["QUICK_REPLIES","SERVICE_STATUS","RESOLUTION_TIMELINE","HUMAN_HANDOVER"],stages:["Use verified room","Classify issue","Set urgency","Acknowledge and escalate"] },
  { id:"hotel-stay-resolution",version:1,key:"HOTEL_RESOLUTION_FEEDBACK",name:"Resolution and feedback",journey:"IN_STAY",access:"VERIFIED_STAY",menuLabel:"My request status",openingQuestion:"Show the current status of my hotel request and let me confirm the outcome.",description:"Makes ownership and progress visible and collects feedback only after resolution.",intentTerms:["status","update","resolved","resolution","done","feedback","still waiting","my request"],requiredKnowledge:["Response SLA","Department ownership"],requiredConnector:null,department:"Front Desk",smartOutputs:["SERVICE_STATUS","RESOLUTION_TIMELINE","FEEDBACK","HUMAN_HANDOVER"],stages:["Received","Acknowledged","In progress","Resolved","Feedback"] }
] as const;

export function hotelFlowTemplate(key: TenantFlowTemplateKey) {
  return HOTELGPT_FLOW_LIBRARY.find(template => template.key === key) || null;
}

export function hotelFlowTemplates(journey?: HotelFlowJourney) {
  return journey ? HOTELGPT_FLOW_LIBRARY.filter(template => template.journey === journey) : [...HOTELGPT_FLOW_LIBRARY];
}

function normalized(value:string) { return value.toLowerCase().replace(/[^a-z0-9\s-]/g," ").replace(/\s+/g," ").trim(); }

export function matchPublishedHotelFlow(flows: readonly TenantFlowDefinition[], journey:HotelFlowJourney, message:string) {
  const source=normalized(message);
  return flows.filter(flow=>flow.status==="PUBLISHED"&&flow.botCategory==="STAY"&&flow.journey===journey)
    .map(flow=>({flow,template:hotelFlowTemplate(flow.templateKey),score:(hotelFlowTemplate(flow.templateKey)?.intentTerms||[]).filter(term=>source.includes(normalized(term))).length}))
    .filter(item=>item.template&&item.score>0).sort((a,b)=>b.score-a.score)[0]||null;
}
