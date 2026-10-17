import {NextResponse} from 'next/server';
import {resolveClientWorkspaceAccess} from '@/lib/client-access';
import {boundedFormData} from '@/lib/bounded-form-data';
import {consumeRateLimit} from '@/lib/rate-limit';
import {ownerAnswerPreview} from '@/lib/services/owner-answer-preview';
export async function POST(request:Request){
 const access=await resolveClientWorkspaceAccess({requireManage:true,requireActiveSubscription:true,propertySlug:new URL(request.url).searchParams.get('propertySlug')});
 if(!access.ok)return NextResponse.json({error:access.error},{status:access.status});
 try{
  const data=await boundedFormData(request,65536);const question=data.get('question');
  if(typeof question!=='string'||!question.trim()||question.length>8000)return NextResponse.json({error:'Enter a question of at most 8,000 characters.'},{status:400});
  if(!consumeRateLimit(`owner-answer-preview:${access.organization.id}:${access.propertyId}`,12,60000).allowed)return NextResponse.json({error:'Please wait a minute before testing more questions.'},{status:429});
  const result=await ownerAnswerPreview({organizationId:access.organization.id,propertyId:access.propertyId,actor:access.user.username},question);
  return NextResponse.json({answer:result.answer,disposition:result.disposition,coverage:result.coverage,sources:result.evidence.map(e=>({id:e.id,title:e.title,url:e.url})),totalMs:result.totalMs},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'The private preview could not finish. Check that your reviewed knowledge is published, then try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
