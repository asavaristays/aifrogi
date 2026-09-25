import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { readKnowledgeSettings, writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { hasTrustedSameOrigin } from "@/lib/security/request-origin";
import { installHotelQuickReplyDefaults, normalizeHotelQuickReply } from "@/lib/hotelgpt-quick-replies";

export async function GET(){const access=await getCurrentClientAccess();if(!access)return NextResponse.json({error:"Unauthorized"},{status:401});if(access.organization.botProfile?.category!=="STAY")return NextResponse.json({error:"HotelGPT workspace required"},{status:404});const settings=await readKnowledgeSettings(await getCurrentWorkspaceSlug());return NextResponse.json({replies:settings.hotelQuickReplies||[],canManage:canManageWorkspace(access.role),role:access.role});}

export async function POST(request:Request){
  const access=await getCurrentClientAccess();if(!access)return NextResponse.json({error:"Unauthorized"},{status:401});
  if(access.organization.botProfile?.category!=="STAY")return NextResponse.json({error:"HotelGPT workspace required"},{status:404});
  if(!canManageWorkspace(access.role))return NextResponse.json({error:"Owner or Admin access is required."},{status:403});
  if(!hasTrustedSameOrigin(request))return NextResponse.json({error:"Cross-origin request denied"},{status:403});
  const payload=await request.json().catch(()=>null) as {action?:string;reply?:unknown;id?:string}|null;
  const slug=await getCurrentWorkspaceSlug();const settings=await readKnowledgeSettings(slug);let replies=[...(settings.hotelQuickReplies||[])];
  if(payload?.action==="install_defaults"){
    if(replies.length)return NextResponse.json({error:"This hotel already has an independent saved-reply library. Defaults will not replace it."},{status:409});
    replies=installHotelQuickReplyDefaults();await writeKnowledgeSettings(slug,{hotelQuickReplies:replies});return NextResponse.json({ok:true,replies});
  }
  if(payload?.action==="save"){
    const normalized=normalizeHotelQuickReply(payload.reply);if(!normalized)return NextResponse.json({error:"A valid journey, status, label and message are required."},{status:400});
    const previous=replies.find(item=>item.id===normalized.id);const saved={...normalized,version:previous?previous.version+1:normalized.version};replies=previous?replies.map(item=>item.id===saved.id?saved:item):[...replies,saved];await writeKnowledgeSettings(slug,{hotelQuickReplies:replies});return NextResponse.json({ok:true,reply:saved,replies});
  }
  if(payload?.action==="delete"){replies=replies.filter(item=>item.id!==payload.id);await writeKnowledgeSettings(slug,{hotelQuickReplies:replies});return NextResponse.json({ok:true,replies});}
  return NextResponse.json({error:"Unsupported saved-reply action."},{status:400});
}
