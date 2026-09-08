import {getDb} from '../lib/db';
import {processAppointmentInboundEvent} from '../lib/appointment-journey-service';
import {decryptSecretValue} from '../lib/field-encryption';
import {refreshGoogleAppointmentAccessToken} from '../lib/appointment-journey-google-oauth';
async function main(){
 const db=getDb();if(!db)throw Error('Database unavailable');
 const tenant=await db.appointmentTenant.findUnique({where:{id:'cmtp0i0bv000o6rkxnlxknrqk'},include:{services:{where:{active:true}}}});
 if(!tenant||tenant.status!=='GOOGLE_READY'||tenant.razorpayEnabled||!tenant.calendarId||!tenant.sheetId)throw Error('Test preconditions failed');
 const prefix='QA-B4-20260906'; const phone='000000000000';
 if(await db.appointmentMessageLog.findFirst({where:{inboundMessageId:{startsWith:prefix}}}))throw Error('Test already started; inspect rather than repeat');
 const send=async(n:number,payload:any,event_type:any='text')=>{
 const r=await processAppointmentInboundEvent({tenant_id:tenant.aifrogiTenantId,customer_phone:phone,event_type,payload,message_id:prefix+'-'+n,timestamp:Math.floor(Date.now()/1000)});
 if(r.error)throw Error('Journey step '+n+' failed: '+r.status);return r;
 };
 await send(1,{text:'Book a test appointment'});
 await send(2,{reply_id:tenant.services[0].id},'list_reply');
 const slots=await send(3,{text:'QA TEST ONLY - AiFrogi connector verification'});
 const slot=(slots.result as any)?.session?.offeredSlots?.[0];if(!slot)throw Error('No verified slot available');
 const booked=await send(4,{reply_id:'slot_'+slot},'list_reply');
 const repeat=await send(4,{reply_id:'slot_'+slot},'list_reply');
 const booking=await db.appointmentBooking.findUnique({where:{id:(booked.result as any).bookingId}});
 if(!booking?.gcalEventId||booking.status!=='CONFIRMED')throw Error('Booking not confirmed');
 const token=await refreshGoogleAppointmentAccessToken(decryptSecretValue(tenant.googleRefreshTokenEnc)!);
 const headers={Authorization:'Bearer '+token};
 const eventResponse=await fetch('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(tenant.calendarId)+'/events/'+booking.gcalEventId,{headers});
 const event=await eventResponse.json();
 const sheetResponse=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+tenant.sheetId+'/values/Bookings!A:J',{headers});
 const sheet=await sheetResponse.json();
 const rows=(sheet.values||[]).filter((r:any[])=>r[0]===booking.id);
 if(!eventResponse.ok||event.extendedProperties?.private?.appointmentBookingId!==booking.id||!sheetResponse.ok||rows.length!==1||!(repeat.result as any).duplicate)throw Error('Provider read-back failed');
 console.log(JSON.stringify({test:prefix,bookingId:booking.id,calendarReadBack:true,sheetRows:rows.length,duplicateInboundSuppressed:true,slot,synthetic:true,realCustomerMessagesSent:false}));
 await db.$disconnect();
}
main().catch(()=>{console.error('Live QA stopped. Inspect scoped test records; no automatic repeat.');process.exitCode=1;});
