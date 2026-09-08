import test from 'node:test';
import assert from 'node:assert/strict';
import { createGoogleAppointmentEvent } from '../../lib/appointment-journey-google-oauth';

const originalFetch = globalThis.fetch;
test.afterEach(() => { globalThis.fetch = originalFetch; });
const input = {
  accessToken: 'synthetic', calendarId: 'tenant-calendar', timeZone: 'Asia/Kolkata',
  bookingId: 'booking-one', existingEventId: 'stored-event', tenantName: 'Test',
  serviceName: 'Consultation', customerName: 'Fictional', customerPhone: '000',
  slotStart: new Date('2026-09-08T04:00:00Z'), slotEnd: new Date('2026-09-08T04:30:00Z'),
  status: 'CONFIRMED' as const,
};
function validEvent() { return {
  id: input.existingEventId, status: 'confirmed', summary: 'Appointment: Fictional - Consultation',
  start: { dateTime: input.slotStart.toISOString() }, end: { dateTime: input.slotEnd.toISOString() },
  extendedProperties: { private: { appointmentBookingId: input.bookingId } },
}; }
test('stored event is verified with GET only before confirmation', async () => {
  let reads = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options?.method, 'GET');
    assert.equal(String(url), 'https://www.googleapis.com/calendar/v3/calendars/tenant-calendar/events/stored-event');
    reads++; return Response.json(validEvent());
  };
  assert.equal(await createGoogleAppointmentEvent(input), input.existingEventId);
  assert.equal(reads, 1);
});
for (const fault of ['wrong-id', 'wrong-booking', 'moved-start', 'moved-end', 'cancelled', 'still-held'] as const) {
  test(`stored event fails closed without writes: ${fault}`, async () => {
    const event = validEvent();
    if (fault === 'wrong-id') event.id = 'another-event';
    if (fault === 'wrong-booking') event.extendedProperties.private.appointmentBookingId = 'another-booking';
    if (fault === 'moved-start') event.start.dateTime = '2026-09-08T06:00:00Z';
    if (fault === 'moved-end') event.end.dateTime = '2026-09-08T06:30:00Z';
    if (fault === 'cancelled') event.status = 'cancelled';
    if (fault === 'still-held') event.summary = 'Hold: Fictional - Consultation';
    globalThis.fetch = async (_url, options) => { assert.equal(options?.method, 'GET'); return Response.json(event); };
    await assert.rejects(createGoogleAppointmentEvent(input), /Confirmation withheld/);
  });
}
for (const status of [403, 404, 410, 503]) test(`provider ${status} never causes stored event recreation`, async () => {
  let calls = 0;
  globalThis.fetch = async (_url, options) => { calls++; assert.equal(options?.method, 'GET'); return Response.json({error:{message:'Synthetic provider failure'}}, {status}); };
  await assert.rejects(createGoogleAppointmentEvent(input), /Synthetic provider failure/);
  assert.equal(calls, 1);
});
test('uncertain provider read never causes a new write', async () => {
  globalThis.fetch = async (_url, options) => { assert.equal(options?.method, 'GET'); throw new Error('Synthetic timeout'); };
  await assert.rejects(createGoogleAppointmentEvent(input), /Synthetic timeout/);
});
