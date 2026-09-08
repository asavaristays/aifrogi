// Explicit tenant scope: these are navigation shortcuts, not generated knowledge.
export const WEBTECHNOSYS_BOT_SLUG = 'webtechnosys-ai-agency-e5da22';
export const webtechnosysLinks = {
  website: 'https://webtechnosys.com/',
  training: 'https://webtechnosys.com/training-booking/',
  film: 'https://webtechnosys.com/ai-filmmaking/',
  phone: 'tel:+917410582898',
  email: 'mailto:info@webtechnosys.com',
  gallery: 'https://app.aifrogi.com/ai-bot-demos',
} as const;
export const showcaseLinks = [
  { name: 'BusinessGPT', category: 'Business & services', slug: 'showcase-businessgpt' },
  { name: 'ClinicGPT', category: 'Single clinic', slug: 'showcase-clinicgpt' },
  { name: 'HotelGPT', category: 'Hotels & stays', slug: 'showcase-hotelgpt' },
  { name: 'DineGPT', category: 'Restaurants', slug: 'showcase-dinegpt' },
  { name: 'eduGPT', category: 'Schools & colleges', slug: 'showcase-edugpt' },
  { name: 'PropertyGPT', category: 'Real estate', slug: 'showcase-propertygpt' },
  { name: 'FlowCart', category: 'Online stores', slug: 'showcase-flowcart' },
  { name: 'Custom Bot', category: 'Custom workflows', slug: 'showcase-custombot' },
] as const;
export function showcaseUrl(slug: string) {
  if (!showcaseLinks.some(item => item.slug === slug)) throw new Error('Unknown showcase');
  return `https://app.aifrogi.com/bot/${slug}`;
}
