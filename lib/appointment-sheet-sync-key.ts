import {createHash} from 'node:crypto';

/** Stable per-booking record and content revision; not provider exactly-once proof. */
export function appointmentSheetSyncKey(sheetId:string,booking:{id:string;createdAt:Date;customerName:string;customerPhone:string;serviceName:string;slotStart:Date;slotEnd:Date;status:string;paymentStatus:string;gcalEventId?:string|null}){
 const record='Booking:'+createHash('sha256').update(JSON.stringify([sheetId,booking.id])).digest('hex');
 const revision=createHash('sha256').update(JSON.stringify([sheetId,booking.id,booking.createdAt.toISOString(),booking.customerName,booking.customerPhone,booking.serviceName,booking.slotStart.toISOString(),booking.slotEnd.toISOString(),booking.status,booking.paymentStatus,booking.gcalEventId||''])).digest('hex');
 return {record,revision};
}
