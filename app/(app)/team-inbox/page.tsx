import type { Metadata } from 'next';
import { TeamInboxStatus } from '@/components/lead-inbox/team-inbox-status';
import { WhatsAppBotClient } from '@/components/whatsapp/whatsapp-bot-client';
import { resolveClientWorkspaceAccess } from '@/lib/client-access';
import { getCurrentWorkspaceSlug } from '@/lib/workspace';
import { loadLeads } from '@/lib/services/lead-service';
import { redirect } from 'next/navigation';
import styles from '@/components/lead-inbox/team-inbox.module.css';
import type { WhatsAppIntegration } from '@/types';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'Team Inbox · AiFrogi',manifest:'/team-inbox.webmanifest',robots:{index:false,follow:false}};
const websiteOnlyIntegration: WhatsAppIntegration = {id:'',provider:'META_CLOUD_API',businessAccountId:null,phoneNumberId:null,displayPhoneNumber:null,webhookVerifyToken:null,status:'NOT_CONFIGURED',approvedBy:null,approvedAtLabel:null,lastValidatedAtLabel:null,notes:null,aiModeEnabled:false};
export default async function TeamInboxPage(){
  const access=await resolveClientWorkspaceAccess({propertySlug:await getCurrentWorkspaceSlug()});
  if(!access.ok)redirect('/login?returnTo=%2Fteam-inbox');
  const leads=await loadLeads(access.propertySlug);
  return <div className={styles.page}><TeamInboxStatus/><WhatsAppBotClient leads={leads.filter(lead=>Boolean(lead.websiteSession))} integration={websiteOnlyIntegration} enabledChannels={[]} teamMode/></div>;
}
