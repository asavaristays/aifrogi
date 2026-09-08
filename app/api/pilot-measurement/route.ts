import {NextResponse} from 'next/server';
import {getCurrentUser} from '@/lib/auth-server';
import {resolveClientWorkspaceAccess} from '@/lib/client-access';
import {getPilotMeasurement} from '@/lib/repositories/pilot-measurement-repository';
export const dynamic='force-dynamic';
export async function GET(){
 const user=await getCurrentUser();
 let propertyId:string|undefined;
 if(user?.role!=='admin'){const access=await resolveClientWorkspaceAccess();if(!access.ok)return NextResponse.json({error:'Workspace access required'},{status:403});propertyId=access.propertyId;}
 try{return NextResponse.json(await getPilotMeasurement(propertyId),{headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:'Measurement unavailable; no score issued'},{status:503});}
}
