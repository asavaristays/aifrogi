import { getDb } from '../lib/db';

const db = getDb();
if (!db) throw new Error('Database unavailable');

const PROPERTY_SLUG = 'webtechnosys-ai-agency-e5da22';
const ACTOR = 'info@aifrogi.com';

async function main() {
  const property = await db!.property.findUnique({
    where: { slug: PROPERTY_SLUG },
    select: { id: true, organizationId: true },
  });
  if (!property) throw new Error('Webtechnosys workspace not found');
  if (!property.organizationId) throw new Error('Webtechnosys workspace has no organization');
  const organizationId = property.organizationId;

  const claims = await db!.knowledgeEntry.findMany({
    where: {
      propertyId: property.id,
      status: 'PUBLISHED',
      conflictStatus: 'CLEAR',
      category: { in: ['Support Number', 'Training Booking'] },
    },
    select: { id: true, category: true },
  });
  const support = claims.find((claim) => claim.category === 'Support Number');
  const training = claims.find((claim) => claim.category === 'Training Booking');
  if (!support || !training) throw new Error('Required published claims are unavailable');

  const result = await db!.$transaction(async (transaction) => {
    const phone = await transaction.knowledgeGap.updateMany({
      where: { propertyId: property.id, status: 'OPEN', normalizedQuestion: 'phone no' },
      data: { status: 'RESOLVED', resolutionEntryId: support.id },
    });
    const booking = await transaction.knowledgeGap.updateMany({
      where: { propertyId: property.id, status: 'OPEN', normalizedQuestion: 'how to book training' },
      data: { status: 'RESOLVED', resolutionEntryId: training.id },
    });
    const excluded = await transaction.knowledgeGap.updateMany({
      where: { propertyId: property.id, status: 'OPEN', normalizedQuestion: 'hotelradar more information' },
      data: { status: 'DISMISSED' },
    });
    await transaction.onboardingActivity.create({
      data: {
        organizationId,
        actorEmail: ACTOR,
        action: 'WEBTECHNOSYS_LAUNCH_GAPS_RECONCILED',
        detail: `Resolved phone and training gaps against existing published claims after live website-bot verification; dismissed HotelRadar request as owner-confirmed out of scope. Counts: phone ${phone.count}, training ${booking.count}, excluded ${excluded.count}.`,
      },
    });
    return { phone: phone.count, training: booking.count, excluded: excluded.count };
  });

  const remainingOpen = await db!.knowledgeGap.count({ where: { propertyId: property.id, status: 'OPEN' } });
  console.log(JSON.stringify({ property: PROPERTY_SLUG, ...result, remainingOpen }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Gap reconciliation failed');
    process.exitCode = 1;
  })
  .finally(async () => db!.$disconnect());
