import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, registrationRepository, teamRepository, guidance] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/repositories/trial-registration-repository"),
    import("@/lib/repositories/team-repository"),
    import("@/lib/onboarding-guidance")
  ]);
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");
  const runId = Date.now();
  const email = `trial-qa-${runId}@aifrogi.local`;
  let organizationId: string | null = null;

  try {
    const first = await registrationRepository.registerTrialOrganization({ companyName: `AiFrogi QA ${runId}`, ownerName: "Lifecycle QA", ownerEmail: email, website: "https://example.com", industry: "Professional services", country: "India", timezone: "Asia/Kolkata" });
    organizationId = first.organizationId;
    const repeated = await registrationRepository.registerTrialOrganization({ companyName: `AiFrogi QA ${runId}`, ownerName: "Lifecycle QA", ownerEmail: email, website: "https://example.com", industry: "Professional services", country: "India", timezone: "Asia/Kolkata" });
    assert(repeated.organizationId === first.organizationId && repeated.resumed, "Pending registration was not resumed safely.");
    assert(repeated.token !== first.token, "Activation token was not rotated.");

    const pending = await db.organization.findUnique({ where: { id: first.organizationId }, include: { members: true, onboarding: true } });
    assert(pending?.status === "PENDING_EMAIL", "Organization did not enter pending email state.");
    assert(pending.members[0]?.status === "INVITED" && !pending.members[0].passwordHash, "Owner became active before verification.");
    assert(pending.onboarding?.lifecycleStatus === "EMAIL_VERIFICATION", "Onboarding did not wait for email verification.");
    const pendingGuidance = guidance.getOnboardingGuidance(pending);
    assert(pendingGuidance.action === "Check activation email", "Pending registration guidance is incorrect.");

    const invitation = await teamRepository.getInvitation(repeated.token);
    assert(invitation?.invitedBy === registrationRepository.SELF_SERVICE_REGISTRATION, "Activation link lost its registration purpose.");
    const member = await teamRepository.activateInvitation(repeated.token, "Aifrogi-QA-2026!");
    assert(member.registration, "Owner activation was not recognized as self-service registration.");

    const active = await db.organization.findUnique({ where: { id: first.organizationId }, include: { members: true, onboarding: true, activities: true } });
    assert(active?.status === "ONBOARDING", "Activated organization did not advance to onboarding.");
    assert(active.members[0]?.status === "ACTIVE" && active.members[0].passwordHash, "Owner credential was not activated.");
    assert(active.onboarding?.lifecycleStatus === "DRAFT", "Onboarding lifecycle did not become editable.");
    assert(active.activities.some((activity) => activity.action === "EMAIL_VERIFIED"), "Email verification activity was not recorded.");
    const trial = guidance.getTrialWindow(active);
    assert(trial.enabled && trial.daysLeft !== null && trial.daysLeft <= 30, "Trial window was not calculated.");
    const activeGuidance = guidance.getOnboardingGuidance(active);
    assert(activeGuidance.step === 1 && activeGuidance.owner === "You", "Activated workspace guidance is incorrect.");
    console.log("Trial registration lifecycle verification passed.");
  } finally {
    if (organizationId) await db.organization.deleteMany({ where: { id: organizationId } });
    const residue = await db.organizationMember.count({ where: { email } });
    assert(residue === 0, "Synthetic trial registration was not fully removed.");
    console.log("Synthetic trial workspace removed.");
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
