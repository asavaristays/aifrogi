import test from 'node:test';
import assert from 'node:assert/strict';
import {locateBookingRow,parseSheetReservation,reconcileReservedSheetRow,sheetRowRevision} from '../../lib/appointment-sheet-recovery';
const original=globalThis.fetch;test.afterEach(()=>{globalThis.fetch=original;});
const values=['booking-a','2026-09-06','=1+1','TEST','Demo','start','end','CONFIRMED','PAID','event'];
const input={accessToken:'synthetic',sheetId:'synthetic-sheet',values,reservation:{version:1 as const,row:2,revision:sheetRowRevision(values),phase:'PENDING' as const},mayWrite:true};
const header=['Booking ID'];
test('row allocation accounts for durable reservations',()=>assert.equal(locateBookingRow([header],'a',[2,3]),4));
test('existing booking reuses its row despite interleaved bookings',()=>assert.equal(locateBookingRow([header,values,['booking-b']],'booking-a',[2,3]),2));
test('duplicate booking rows fail closed',()=>assert.throws(()=>locateBookingRow([header,values,values],'booking-a',[]),/Duplicate/));
test('changed header fails closed',()=>assert.throws(()=>locateBookingRow([['Other']],'a',[]),/header/));
test('invalid persisted reservation fails closed',()=>assert.throws(()=>parseSheetReservation('{"version":1,"row":1}'),/Invalid/));
test('fresh reserved write uses RAW PUT and read-back',async()=>{
 let rows=[header],writes=0;globalThis.fetch=async(url,options)=>{if(options?.method==='PUT'){writes++;assert.match(String(url),/A2:J2\?valueInputOption=RAW/);rows=[header,JSON.parse(String(options.body)).values[0]];assert.equal(rows[1][2],'=1+1');return Response.json({});}return Response.json({values:rows});};
 await reconcileReservedSheetRow(input);assert.equal(writes,1);
});
test('lost response is recovered by read-back without repeat write',async()=>{
 let rows=[header],writes=0;globalThis.fetch=async(_url,options)=>{if(options?.method==='PUT'){writes++;rows=[header,values];throw Error('Lost response');}return Response.json({values:rows});};
 await assert.rejects(reconcileReservedSheetRow(input),/Lost response/);await reconcileReservedSheetRow({...input,mayWrite:false});assert.equal(writes,1);
});
test('uncertain empty row is not blindly written',async()=>{globalThis.fetch=async(_url,options)=>{assert.notEqual(options?.method,'PUT');return Response.json({values:[header]});};await assert.rejects(reconcileReservedSheetRow({...input,mayWrite:false}),/uncertain/);});
test('foreign occupied row is never overwritten',async()=>{globalThis.fetch=async(_url,options)=>{assert.notEqual(options?.method,'PUT');return Response.json({values:[header,['foreign']]});};await assert.rejects(reconcileReservedSheetRow(input),/another booking/);});
test('moved row is not overwritten',async()=>{globalThis.fetch=async()=>Response.json({values:[header,[],values]});await assert.rejects(reconcileReservedSheetRow(input),/moved/);});
test('mismatched read-back leaves write unverified',async()=>{globalThis.fetch=async(_url,options)=>options?.method==='PUT'?Response.json({}):Response.json({values:[header]});await assert.rejects(reconcileReservedSheetRow(input),/read-back/);});
test('revoked access cannot write',async()=>{globalThis.fetch=async()=>Response.json({error:{message:'Revoked'}},{status:403});await assert.rejects(reconcileReservedSheetRow(input),/Revoked/);});
test('changed booking cannot overwrite uncertain earlier revision',async()=>{await assert.rejects(reconcileReservedSheetRow({...input,values:[...values.slice(0,7),'CANCELLED',...values.slice(8)],mayWrite:false}),/changed/);});
test('verified prior row supports cancellation in place',async()=>{let rows=[header,values],writes=0;const cancelled=[...values];cancelled[7]='CANCELLED';globalThis.fetch=async(_url,options)=>{if(options?.method==='PUT'){writes++;rows=[header,cancelled];return Response.json({});}return Response.json({values:rows});};await reconcileReservedSheetRow({...input,values:cancelled,reservation:{...input.reservation,revision:sheetRowRevision(cancelled)}});assert.equal(writes,1);assert.equal(rows.length,2);});
