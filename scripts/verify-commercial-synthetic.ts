import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function main() {
  const target=new URL(process.env.DATABASE_URL || '');
  assert.ok(['127.0.0.1','localhost'].includes(target.hostname) && target.pathname.includes('p2b_rehearsal'), 'Synthetic rehearsal requires an explicit localhost rehearsal database');
  // No provider request or customer email is authorised by this rehearsal.
  globalThis.fetch=async()=>{throw new Error('EXTERNAL_IO_FORBIDDEN_IN_SYNTHETIC_REHEARSAL');};
  const {getBootstrapDb,withDatabaseIdentity}=await import('../lib/db');
  const registration=await import('../lib/repositories/trial-registration-repository');
  const team=await import('../lib/repositories/team-repository');
  const db=getBootstrapDb();assert.ok(db);
  const ids:string[]=[]; const emails:string[]=[]; const run=randomUUID();
  try {
    await withDatabaseIdentity({organizationId:'',platformAuthority:true,actor:'synthetic-commercial-rehearsal',systemPurpose:'synthetic-only'},async()=>{
      for(const category of ['BUSINESS_AI','STAY'] as const) {
        const input={companyName:`Synthetic Commercial ${category} ${run}`,ownerName:'Asha Rehearsal',ownerEmail:`synthetic-${category.toLowerCase()}-${run}@example.invalid`,website:'',industry:'Synthetic services',country:'India',timezone:'Asia/Kolkata',botCategory:category};
        emails.push(input.ownerEmail);
        const first=await registration.registerTrialOrganization(input);ids.push(first.organizationId);
        const pending: {status:string;members:Array<{status:string;passwordHash:string|null}>;botProfile:{status:string}|null}=await db.organization.findUniqueOrThrow({where:{id:first.organizationId},include:{members:true,botProfile:true}});
        assert.equal(pending.status,'PENDING_EMAIL');assert.equal(pending.members[0].status,'INVITED');assert.equal(pending.members[0].passwordHash,null);assert.equal(pending.botProfile?.status,'DRAFT');
        const resumed=await registration.registerTrialOrganization(input);assert.equal(resumed.organizationId,first.organizationId);assert.notEqual(resumed.token,first.token);
        await assert.rejects(team.activateInvitation(first.token,'Synthetic-Rehearsal-2026!'),/invalid or has expired/);
        await assert.rejects(team.activateInvitation(resumed.token,'short'),/at least 10/);
        await db.organizationMember.updateMany({where:{organizationId:first.organizationId},data:{invitationExpiresAt:new Date(Date.now()-60_000)}});
        await assert.rejects(team.activateInvitation(resumed.token,'Synthetic-Rehearsal-2026!'),/invalid or has expired/);
        const fresh=await registration.registerTrialOrganization(input);
        const activated=await team.activateInvitation(fresh.token,'Synthetic-Rehearsal-2026!');assert.equal(activated.registration,true);
        assert.equal(await team.verifyTeamMemberCredential(input.ownerEmail,'wrong-password'),null);
        assert.equal((await team.verifyTeamMemberCredential(input.ownerEmail,'Synthetic-Rehearsal-2026!'))?.username,input.ownerEmail);
        await assert.rejects(team.activateInvitation(fresh.token,'Synthetic-Rehearsal-2026!'),/invalid or has expired/);
        await assert.rejects(registration.registerTrialOrganization(input),/already uses this email/);
        const active: {status:string;botProfile:{status:string}|null;members:Array<{status:string;invitationTokenHash:string|null;passwordHash:string|null}>;properties:Array<{id:string}>}=await db.organization.findUniqueOrThrow({where:{id:first.organizationId},include:{botProfile:true,members:true,properties:true}});
        assert.equal(active.status,'ONBOARDING');assert.equal(active.botProfile?.status,'DRAFT');assert.equal(active.members[0].invitationTokenHash,null);
        assert.equal(active.members[0].status,'ACTIVE');assert.notEqual(active.members[0].passwordHash,'Synthetic-Rehearsal-2026!');
        const jobs: Array<{workflowId:string;actionType:string}>=await db.automationJob.findMany({where:{propertyId:active.properties[0].id}});
        assert.equal(jobs.filter(j=>j.workflowId==='level-one-website-v1').length,1);
        assert.equal(jobs.filter(j=>j.actionType==='TRIAL_CONVERSION_EMAIL').length,2);
        console.log(`PASS ${category}: pending ownership, rotated/expired/replayed tokens, password verification, duplicate account denial, durable preparation/reminders, no premature LIVE`);
      }
      const schema=readFileSync('prisma/schema.prisma','utf8');
      const tenantModels=[...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)].filter(([, ,body])=>/^\s+(organizationId|propertyId|tenantId)\s+/m.test(body)).map(([,name])=>name);
      const tables=await db.$queryRaw<Array<{name:string;enabled:boolean;forced:boolean}>>`SELECT c.relname name,c.relrowsecurity enabled,c.relforcerowsecurity forced FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'`;
      const missing=tenantModels.filter(name=>!tables.some(t=>t.name===name&&t.enabled&&t.forced));
      assert.deepEqual(missing,[],`Actual database tenant RLS missing: ${missing.join(',')}`);
      console.log(`PASS actual PostgreSQL forced-RLS coverage for ${tenantModels.length} tenant-keyed models`);
    });
  } finally {
    await db.organization.deleteMany({where:{id:{in:ids}}});
    assert.equal(await db.organizationMember.count({where:{email:{in:emails}}}),0);
    console.log('PASS synthetic account cleanup; no customer records used');
    await db.$disconnect();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
