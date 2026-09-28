import {NextResponse} from "next/server";
import {getCurrentClientAccess,canManageWorkspace} from "@/lib/client-access";
import {createReadinessBillingOrder} from "@/lib/readiness-billing";
export async function POST(request:Request){
 const access=await getCurrentClientAccess();if(!access)return NextResponse.json({error:"Sign in to your billing workspace."},{status:401});
 if(!canManageWorkspace(access.role))return NextResponse.json({error:"Owner or admin required."},{status:403});
 const input=await request.json().catch(()=>null) as {ticket?:string}|null;
 if(typeof input?.ticket!=="string")return NextResponse.json({error:"Signed Readiness quote required."},{status:400});
 try{return NextResponse.json(await createReadinessBillingOrder({token:input.ticket,organizationId:access.organization.id,propertyIds:access.organization.properties.map(p=>p.id),actor:access.user.username}));}
 catch{return NextResponse.json({error:"Readiness checkout unavailable or quote invalid. Contact billing support."},{status:409});}
}
