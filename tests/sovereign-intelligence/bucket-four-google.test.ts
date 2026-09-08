import test from 'node:test';
import assert from 'node:assert/strict';
import { getGoogleAppointmentAvailableSlots, appendAppointmentBookingToSheet, createGoogleAppointmentEvent } from '../../lib/appointment-journey-google-oauth';

const original = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = original; });
const input = {accessToken:'synthetic',calendarId:'tenant-calendar',timeZone:'Asia/Kolkata',durationMin:30,now:new Date('2026-09-07T03:00:00Z')};
const booking = {...input,bookingId:'booking-a',tenantName:'Test',serviceName:'Test',customerName:'Test',customerPhone:'000',slotStart:input.now,slotEnd:new Date(input.now.getTime()+1800000),status:'CONFIRMED' as const};
test('B4 stable event ID recovers a lost response without duplicate creation',async()=>{
  const events=new Map<string,any>();let first=true;
  globalThis.fetch=async(url,options)=>{
    assert.ok(options?.signal);
    if(options?.method==='POST'){
      const event=JSON.parse(String(options.body));
      if(events.has(event.id))return Response.json({error:{}},{status:409});
      events.set(event.id,{...event,status:'confirmed'});
      if(first){first=false;throw new Error('Lost response');}
    }
    return Response.json(events.get(String(url).split('/').at(-1)!));
  };
  await assert.rejects(createGoogleAppointmentEvent(booking),/Lost response/);
  const id=await createGoogleAppointmentEvent(booking);
  assert.match(id,/^[0-9a-f]{64}$/);assert.equal(events.size,1);
});
for(const mismatch of ['identity','time','cancelled'])test(`B4 read-back rejects ${mismatch}`,async()=>{
  let event:any;
  globalThis.fetch=async(_url,options)=>{
    if(options?.method==='POST'){event={...JSON.parse(String(options.body)),status:'confirmed'};return Response.json({id:event.id});}
    if(mismatch==='identity')event.extendedProperties.private.appointmentBookingId='other';
    if(mismatch==='time')event.start.dateTime='2026-01-01T00:00:00Z';
    if(mismatch==='cancelled')event.status='cancelled';
    return Response.json(event);
  };
  await assert.rejects(createGoogleAppointmentEvent(booking),/read-back/);
});
for (const [name,payload] of Object.entries({missing:{},foreign:{calendars:{other:{busy:[]}}},error:{calendars:{'tenant-calendar':{errors:[{reason:'notFound'}],busy:[]}}},malformed:{calendars:{'tenant-calendar':{busy:[{start:'invalid',end:'invalid'}]}}},absentBusy:{calendars:{'tenant-calendar':{}}}})) {
  test(`B4 availability fails closed: ${name}`, async () => {
    globalThis.fetch = async () => Response.json(payload);
    await assert.rejects(getGoogleAppointmentAvailableSlots(input), /could not be verified/);
  });
}
test('B4 explicitly verified empty calendar offers slots',async()=>{
  globalThis.fetch=async()=>Response.json({calendars:{'tenant-calendar':{busy:[]}}});
  assert.ok((await getGoogleAppointmentAvailableSlots(input)).length>0);
});
test('B4 revoked access cannot offer slots',async()=>{
  globalThis.fetch=async()=>Response.json({error:{message:'Access revoked'}},{status:403});
  await assert.rejects(getGoogleAppointmentAvailableSlots(input),/Access revoked/);
});
test('B4 sheet customer fields use literal RAW values',async()=>{
  let called=false;
  globalThis.fetch=async(url,options)=>{
    called=true;assert.equal(new URL(String(url)).searchParams.get('valueInputOption'),'RAW');
    assert.equal(JSON.parse(String(options?.body)).values[0][2],'=1+1');
    return Response.json({updates:{updatedRows:1}});
  };
  await appendAppointmentBookingToSheet({accessToken:'synthetic',sheetId:'tenant-sheet',booking:{id:'test',createdAt:input.now,customerName:'=1+1',customerPhone:'+910000000000',serviceName:'Test',slotStart:input.now,slotEnd:new Date(input.now.getTime()+1800000),status:'HOLD',paymentStatus:'UNPAID'}});
  assert.equal(called,true);
});
