import test from 'node:test';
import assert from 'node:assert/strict';
import {appointmentSheetSyncKey} from '../../lib/appointment-sheet-sync-key';
const booking={id:'a',createdAt:new Date('2026-09-01'),customerName:'Synthetic',customerPhone:'TEST',serviceName:'Demo',slotStart:new Date('2026-09-10T10:00:00Z'),slotEnd:new Date('2026-09-10T10:30:00Z'),status:'CONFIRMED',paymentStatus:'PAID',gcalEventId:'event'};
test('same booking content yields stable sync identity',()=>assert.deepEqual(appointmentSheetSyncKey('sheet',booking),appointmentSheetSyncKey('sheet',{...booking})));
test('interleaved bookings do not share sync record',()=>assert.notEqual(appointmentSheetSyncKey('sheet',booking).record,appointmentSheetSyncKey('sheet',{...booking,id:'b'}).record));
test('different sheets do not reuse sync record',()=>assert.notEqual(appointmentSheetSyncKey('sheet',booking).record,appointmentSheetSyncKey('other',booking).record));
test('status change changes revision but retains booking record',()=>{const a=appointmentSheetSyncKey('sheet',booking),b=appointmentSheetSyncKey('sheet',{...booking,status:'CANCELLED'});assert.equal(a.record,b.record);assert.notEqual(a.revision,b.revision);});
test('slot changes invalidate sync revision',()=>assert.notEqual(appointmentSheetSyncKey('sheet',booking).revision,appointmentSheetSyncKey('sheet',{...booking,slotEnd:new Date('2026-09-10T11:00:00Z')}).revision));
