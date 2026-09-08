import test from 'node:test';import assert from 'node:assert/strict';
import {clinicDates,clinicSlots,clinicSelectionValid} from '../../lib/demo-sandbox/clinic-availability';
const now=new Date('2026-09-06T00:00:00Z');
test('clinic offers six future non-Sunday dates',()=>{const dates=clinicDates(now);assert.equal(dates.length,6);assert.equal(dates[0],'2026-09-07');assert.ok(dates.every(d=>new Date(d).getUTCDay()!==0));});
test('clinic availability is deterministic and respects occupied periods and duration',()=>{const s=clinicSlots('clean','meera','2026-09-07',now);assert.deepEqual(s,clinicSlots('clean','meera','2026-09-07',now));assert.ok(s.includes('10:00'));assert.ok(!s.includes('10:30'));assert.ok(!s.includes('11:00'));assert.ok(s.includes('12:00'));assert.ok(!s.includes('17:30'));});
test('clinic rejects unsupported doctor, invalid date and invented slot',()=>{assert.deepEqual(clinicSlots('whiten','meera','2026-09-07',now),[]);assert.deepEqual(clinicSlots('consult','arjun','2020-01-01',now),[]);assert.equal(clinicSelectionValid('consult','arjun','2026-09-07','14:00',now),false);assert.equal(clinicSelectionValid('consult','arjun','2026-09-07','15:00',now),true);});
