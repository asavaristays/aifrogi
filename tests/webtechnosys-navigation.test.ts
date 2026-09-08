import test from 'node:test';
import assert from 'node:assert/strict';
import { WEBTECHNOSYS_BOT_SLUG, showcaseLinks, showcaseUrl, webtechnosysLinks } from '../lib/webtechnosys-navigation';

test('navigation is scoped to the existing Webtechnosys bot', () => {
  assert.equal(WEBTECHNOSYS_BOT_SLUG, 'webtechnosys-ai-agency-e5da22');
  assert.ok(!showcaseLinks.some(item => item.slug === String(WEBTECHNOSYS_BOT_SLUG)));
});
test('training shortcut uses the approved training booking path', () => {
  assert.equal(webtechnosysLinks.training, 'https://webtechnosys.com/training-booking/');
  assert.ok(!Object.values(webtechnosysLinks).some(url => url.includes('/booking-engine/')));
});
test('eight unique fictional showcases have canonical share links', () => {
  assert.equal(showcaseLinks.length, 8);
  assert.equal(new Set(showcaseLinks.map(item => item.slug)).size, 8);
  for (const item of showcaseLinks) assert.equal(showcaseUrl(item.slug), `https://app.aifrogi.com/bot/${item.slug}`);
});
test('unrecognised showcase destinations are rejected', () => {
  for (const slug of ['hotelradar', '../admin', 'https://example.com']) assert.throws(() => showcaseUrl(slug));
});
test('contact shortcuts retain approved support details', () => {
  assert.equal(webtechnosysLinks.phone, 'tel:+917410582898');
  assert.equal(webtechnosysLinks.email, 'mailto:info@webtechnosys.com');
});
