import type { Metadata } from 'next';
import { TeamInboxStatus } from '@/components/lead-inbox/team-inbox-status';
import { WhatsAppBotClient } from '@/components/whatsapp/whatsapp-bot-client';
import { resolveClientWorkspaceAccess } from '@/lib/client-access';
import { withTenantDatabaseContext } from '@/lib/security/tenant-database-context';
import { getCurrentWorkspaceSlug } from '@/lib/workspace';
import { loadLeads } from '@/lib/services/lead-service';
import { redirect } from 'next/navigation';
import styles from '@/components/lead-inbox/team-inbox.module.css';
import type { WhatsAppIntegration } from '@/types';
import {readKnowledgeSettings} from '@/lib/repositories/knowledge-repository';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'Team Inbox · AiFrogi',manifest:'/team-inbox.webmanifest',robots:{index:false,follow:false}};
const websiteOnlyIntegration: WhatsAppIntegration = {id:'',provider:'META_CLOUD_API',businessAccountId:null,phoneNumberId:null,displayPhoneNumber:null,webhookVerifyToken:null,status:'NOT_CONFIGURED',approvedBy:null,approvedAtLabel:null,lastValidatedAtLabel:null,notes:null,aiModeEnabled:false};
export default async function TeamInboxPage({searchParams}:{searchParams:Promise<{journey?:string;lead?:string}>}){
  const query=await searchParams;
  if(query.journey==='in-stay')redirect(`/in-stay/inbox${query.lead?`?lead=${encodeURIComponent(query.lead)}`:''}`);
  const access=await resolveClientWorkspaceAccess({propertySlug:await getCurrentWorkspaceSlug()});
  if(!access.ok)redirect('/login?returnTo=%2Fteam-inbox');
  const [leads,settings]=await Promise.all([withTenantDatabaseContext({kind:'tenant',organizationId:access.organization.id,actor:`team-inbox:${access.user.username}`},()=>loadLeads(access.propertySlug)),readKnowledgeSettings(access.propertySlug)]);
  const hotelMode=access.organization.botProfile?.category==='STAY';
  return <div className={styles.page}>
    <div className={styles.journeyHeader}>
      <div><p className={styles.eyebrow}>Guest journey · before arrival</p><h1>Pre-Stay Inbox</h1><p>Booking questions, planning support and enquiries—kept separate from live hotel service.</p></div>
      {hotelMode?<a href="/in-stay/inbox" className={styles.journeyLink}>Open In-Stay service inbox →</a>:null}
    </div>
    <TeamInboxStatus compact/><WhatsAppBotClient leads={leads.filter(lead=>Boolean(lead.websiteSession))} integration={websiteOnlyIntegration} enabledChannels={[]} teamMode hotelMode={hotelMode} initialJourney="pre-stay" lockJourney initialLeadId={query.lead||''} hotelQuickReplies={settings.hotelQuickReplies||[]} operatorRole={access.role} businessName={access.organization.name}/>
  </div>;
}
