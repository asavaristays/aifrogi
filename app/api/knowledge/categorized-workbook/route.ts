import {boundedFormData} from '@/lib/bounded-form-data';
import {consumeRateLimit} from '@/lib/rate-limit';
import { NextResponse } from 'next/server';
import { resolveClientWorkspaceAccess } from '@/lib/client-access';
import { withTenantPropertyDatabaseContext } from '@/lib/security/tenant-database-context';
import { applyCategorizedKnowledgeWorkbook,parseCategorizedKnowledgeWorkbook } from '@/lib/services/categorized-workbook-service';
import {captureBusinessWebsite} from '@/lib/services/business-website-review';
import {buildCrawlReviewWorkbook,readCrawlReviewRows} from '@/lib/services/crawl-review-workbook';

export async function GET(request:Request) {
 const access=await resolveClientWorkspaceAccess({requireManage:true,propertySlug:new URL(request.url).searchParams.get("propertySlug")});
 if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});
 try {
  const bytes=await withTenantPropertyDatabaseContext({organizationId:access.organization.id,propertyId:access.propertyId,actor:access.user.username},async()=>buildCrawlReviewWorkbook(await readCrawlReviewRows(access.propertyId,access.organization.id)));
  return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="AiFrogi-Website-Review.xlsx"','Cache-Control':'private, no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not export website knowledge.'},{status:400});}
}
export async function POST(request:Request) {
 const access=await resolveClientWorkspaceAccess({requireManage:true,propertySlug:new URL(request.url).searchParams.get("propertySlug")});
 if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});
 try {
  const data=await boundedFormData(request,5*1024*1024+65536);const file=data.get('file');const action=String(data.get('action')||'PREVIEW').toUpperCase();
  if(action==='CRAWL'){if(!consumeRateLimit(`owner-website-capture:${access.organization.id}:${access.propertyId}`,6,60*60*1000).allowed)return NextResponse.json({error:'Website reading limit reached. Try again in an hour.'},{status:429,headers:{'Cache-Control':'no-store'}});const result=await captureBusinessWebsite({organizationId:access.organization.id,propertyId:access.propertyId,propertySlug:access.propertySlug,actor:access.user.username});return NextResponse.json({ok:true,...result});}
  if(!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx') || file.size>5*1024*1024)return NextResponse.json({error:'Choose a review .xlsx workbook smaller than 5 MB.'},{status:400});
  // The request cannot authorise another website by supplying sourceOrigin.
  const source=access.organization.website||'';
  if(action==='PREVIEW')return NextResponse.json({ok:true,...await parseCategorizedKnowledgeWorkbook({bytes:new Uint8Array(await file.arrayBuffer()),expectedTenantId:access.propertyId,allowedSourceOrigin:source})});
  if(action!=='APPLY')return NextResponse.json({error:'Unknown import action.'},{status:400});
  const result=await withTenantPropertyDatabaseContext({organizationId:access.organization.id,propertyId:access.propertyId,actor:access.user.username},()=>applyCategorizedKnowledgeWorkbook({organizationId:access.organization.id,propertyId:access.propertyId,actorEmail:access.user.username,allowedSourceOrigin:source,file}));
  return NextResponse.json({ok:true,...result});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not process the workbook.'},{status:400});}
}
