import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDb,withDatabaseTransaction} from '../lib/db';
import {synchronizeAppointmentSheet} from '../lib/appointment-sheet-sync';
const db=getDb();if(!db)throw Error('Database required');
const tag='qa-sheet-'+randomUUID(),sheetId=tag;
let propertyId:string|null=null;
const original=globalThis.fetch;
const rows:string[][]=[['Booking ID']];let writes=0,loseNext=false,blankFail=false;
let pauseWrite:(()=>Promise<void>)|null=null;
const checks:string[]=[];function pass(name:string){checks.push(name);console.log(JSON.stringify({check:name,passed:true}));}
async function main(){
 const property=await db!.property.create({data:{name:tag,slug:tag}});propertyId=property.id;
 const tenant=await db!.appointmentTenant.create({data:{propertyId:property.id,name:tag,aifrogiTenantId:tag,sheetId}});
 async function booking(){return db!.appointmentBooking.create({data:{tenantId:tenant.id,customerName:'SYNTHETIC',customerPhone:'TEST',slotStart:new Date('2026-10-01'),slotEnd:new Date('2026-10-01T00:30:00Z'),status:'CONFIRMED'}});}
 globalThis.fetch=async(url,options)=>{
  assert.ok(String(url).startsWith('https://sheets.googleapis.com/v4/spreadsheets/'+sheetId+'/values/'),'No real provider target permitted');
  if(options?.method==='PUT'){
   writes++;if(pauseWrite)await pauseWrite();
   if(blankFail){blankFail=false;throw Error('Synthetic unknown write result');}
   const match=String(url).match(/Bookings!A(\d+):/);assert.ok(match);const row=Number(match[1]);
   while(rows.length<row)rows.push([]);rows[row-1]=JSON.parse(String(options.body)).values[0];
   if(loseNext){loseNext=false;throw Error('Synthetic lost response');}return Response.json({});
  }return Response.json({values:rows});
 };
 const a=await booking(),b=await booking();
 await synchronizeAppointmentSheet(a.id,'synthetic');await synchronizeAppointmentSheet(b.id,'synthetic');await synchronizeAppointmentSheet(a.id,'synthetic');
 assert.equal(writes,2);assert.equal(rows.filter(r=>r[0]===a.id).length,1);pass('A/B/A retry uses per-booking reservation without duplicate');
 await db!.appointmentBooking.update({where:{id:a.id},data:{status:'CANCELLED'}});await synchronizeAppointmentSheet(a.id,'synthetic');assert.equal(rows.length,3);assert.equal(rows[1][7],'CANCELLED');pass('Cancellation updates original row');
 const c=await booking();loseNext=true;await assert.rejects(synchronizeAppointmentSheet(c.id,'synthetic'),/lost response/);const before=writes;await synchronizeAppointmentSheet(c.id,'synthetic');assert.equal(writes,before);pass('Lost provider response recovers by read-back without another write');
 const d=await booking();blankFail=true;await assert.rejects(synchronizeAppointmentSheet(d.id,'synthetic'));const pendingWrites=writes;await assert.rejects(synchronizeAppointmentSheet(d.id,'synthetic'),/uncertain/);assert.equal(writes,pendingWrites);pass('Uncertain empty result holds for review instead of blind retry');
 const e=await booking();let entered!:()=>void,release!:()=>void;const enteredPromise=new Promise<void>(r=>entered=r),released=new Promise<void>(r=>release=r);pauseWrite=async()=>{entered();await released;};
 const first=synchronizeAppointmentSheet(e.id,'synthetic');await enteredPromise;
 await assert.rejects(synchronizeAppointmentSheet(e.id,'synthetic'),/uncertain/);pauseWrite=null;release();await first;assert.equal(rows.filter(r=>r[0]===e.id).length,1);pass('Concurrent same-booking retry cannot repeat pending write');
 const f=await booking();let txCount=0;
 const adapter=new Proxy(db!,{get(target,key){if(key==='$transaction')return async(work:unknown,options:unknown)=>{
   txCount++;if(txCount===2)throw Error('Synthetic database acknowledgement lost');
   return target.$transaction(work as never,options as never);
 };const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await assert.rejects(withDatabaseTransaction(adapter,()=>synchronizeAppointmentSheet(f.id,'synthetic')),/acknowledgement/);
 const ackWrites=writes;await synchronizeAppointmentSheet(f.id,'synthetic');assert.equal(writes,ackWrites);pass('Provider success followed by DB acknowledgement failure recovers without write');
 assert.ok(await db!.appointmentSheetSyncState.count({where:{tenantId:tenant.id,lastError:{not:null}}}));pass('Unresolved provider outcomes remain operator-visible');
 console.log(JSON.stringify({suite:'Sheets recovery real DB / simulated provider',passed:checks.length,tag,realGoogleWrites:0}));
}
main().catch(e=>{console.error(JSON.stringify({failed:true,message:e instanceof Error?e.message:'failure'}));process.exitCode=1;}).finally(async()=>{
 globalThis.fetch=original;
 if(propertyId){const removed=await db!.property.deleteMany({where:{id:propertyId,slug:tag,name:tag,organizationId:null}});assert.equal(removed.count,1);console.log(JSON.stringify({temporaryFixtureRemoved:true}));}
 await db!.$disconnect();
}).then(()=>process.stdout.write('Sheets QA complete\n',()=>process.exit(process.exitCode||0))).catch(()=>{console.error('Sheets fixture cleanup failed');process.exit(1);});
