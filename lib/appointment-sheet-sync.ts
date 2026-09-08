import {createHash} from 'node:crypto';
import {getDb} from './db';
import {locateBookingRow,parseSheetReservation,readBookingSheet,reconcileReservedSheetRow,sheetRowRevision,type SheetReservation} from './appointment-sheet-recovery';

/** Durable reservation precedes provider writes. A pending attempt may only be
 * reconciled by read-back, never blindly repeated. No cross-system transaction. */
export async function synchronizeAppointmentSheet(bookingId:string,accessToken:string){
 const db=getDb();if(!db)throw Error('Database unavailable.');
 const initial=await db.appointmentBooking.findUnique({where:{id:bookingId},include:{tenant:true}});
 if(!initial?.tenant.sheetId)throw Error('Booking sheet is not configured.');
 const sheetId=initial.tenant.sheetId,tenantId=initial.tenantId;
 const prefix='SheetRow:'+createHash('sha256').update(sheetId).digest('hex')+':';
 const tabName=prefix+bookingId;
 try{
  const planned=await db.$transaction(async tx=>{
   // Shared sheet lock also covers accidental same-sheet mapping across tenants.
   const locks=await tx.$queryRaw<Array<{locked:boolean}>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${prefix},0)) AS locked`;
   if(!locks[0]?.locked)throw Error('Sheets synchronization is busy; retry later.');
   const booking=await tx.appointmentBooking.findUnique({where:{id:bookingId},include:{tenant:true,service:true}});
   if(!booking||booking.tenantId!==tenantId||booking.tenant.sheetId!==sheetId)throw Error('Booking sheet mapping changed.');
   const values=[booking.id,booking.createdAt.toISOString(),booking.customerName,booking.customerPhone,booking.service?.name||'Appointment',booking.slotStart.toISOString(),booking.slotEnd.toISOString(),booking.status,booking.paymentStatus,booking.gcalEventId||''];
   const revision=sheetRowRevision(values);
   const previous=await tx.appointmentSheetSyncState.findUnique({where:{tenantId_tabName:{tenantId,tabName}}});
   const reservation=parseSheetReservation(previous?.cursor||null);
   if(reservation?.phase==='PENDING')return {reservation,values,mayWrite:false};
   const rows=await readBookingSheet(accessToken,sheetId);
   const all=await tx.appointmentSheetSyncState.findMany({where:{tabName:{startsWith:prefix}},select:{cursor:true},take:10001});
   if(all.length>10000)throw Error('Sheets reservation limit reached.');
   const reservedRows=all.flatMap(r=>{const parsed=parseSheetReservation(r.cursor);return parsed?[parsed.row]:[];});
   const located=locateBookingRow(rows,bookingId,reservedRows);
   if(reservation&&located!==reservation.row)throw Error('Reserved booking row moved or was deleted; operator review required.');
   const next:SheetReservation={version:1,row:reservation?.row||located,revision,phase:'PENDING'};
   await tx.appointmentSheetSyncState.upsert({where:{tenantId_tabName:{tenantId,tabName}},create:{tenantId,tabName,cursor:JSON.stringify(next)},update:{cursor:JSON.stringify(next),lastError:null}});
   return {reservation:next,values,mayWrite:true};
  },{timeout:25000});
  const result=await reconcileReservedSheetRow({accessToken,sheetId,...planned});
  const pending=JSON.stringify(planned.reservation);
  const verified=JSON.stringify({...planned.reservation,phase:'VERIFIED'});
  await db.$transaction(async tx=>{
   // Compare-and-set: delayed acknowledgements cannot replace a newer revision.
   const saved=await tx.appointmentSheetSyncState.updateMany({where:{tenantId,tabName,cursor:pending},data:{cursor:verified,lastSyncedAt:new Date(),lastError:null}});
   if(!saved.count){const current=await tx.appointmentSheetSyncState.findUnique({where:{tenantId_tabName:{tenantId,tabName}}});if(current?.cursor!==verified)throw Error('Sheets revision changed before acknowledgement.');}
   await tx.appointmentTenant.update({where:{id:tenantId},data:{lastSyncedAt:new Date()}});
  });
  return result;
 }catch(error){
  // Do not persist provider response text: it may contain sensitive information.
  await db.appointmentSheetSyncState.upsert({where:{tenantId_tabName:{tenantId,tabName}},create:{tenantId,tabName,lastError:'SHEETS_RECONCILIATION_REQUIRED: synchronization was not verified.'},update:{lastError:'SHEETS_RECONCILIATION_REQUIRED: synchronization was not verified.'}}).catch(()=>null);
  throw error;
 }
}
