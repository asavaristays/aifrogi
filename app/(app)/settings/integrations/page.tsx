import {TopBar} from "@/components/layout/top-bar";
import {AppointmentJourneyIntegrationCard} from "@/components/settings/appointment-journey-integration-card";
import {PrepareGoogleConnector} from "@/components/settings/prepare-google-connector";
import {getAppointmentTenantForProperty} from "@/lib/appointment-journey-service";
import {resolveClientWorkspaceAccess} from "@/lib/client-access";
import {getCurrentWorkspaceSlug} from "@/lib/workspace";
export const dynamic="force-dynamic";
export default async function IntegrationsPage({searchParams}:{searchParams?:Promise<Record<string,string|string[]|undefined>>}){
  const propertySlug=await getCurrentWorkspaceSlug();
  const access=await resolveClientWorkspaceAccess({propertySlug,requireManage:true,requireActiveSubscription:false});
  if(!access.ok)return <div className="p-8">{access.error}</div>;
  const result=await getAppointmentTenantForProperty(access.propertySlug);
  const params=await searchParams;const status=params?.appointment_google;
  const message=status==='connected'?'Google resources connected. Booking action verification is still required.':status?'Google setup needs attention. Please retry or contact support.':null;
  return <div className="min-h-screen bg-[var(--background)]"><TopBar title="AI Bot connectors" subtitle="Connect business tools only when your bot needs them"/><main className="mx-auto max-w-5xl space-y-6 p-6">
    <section className="rounded-3xl bg-white p-8"><p className="text-sm text-stone-500">Optional setup</p><h2 className="mt-2 text-3xl font-semibold">Give your bot access to the right tools.</h2><p className="mt-4 text-stone-600">Your bot can answer from approved knowledge without a connector. Add Google Calendar and Sheets when you need appointment availability and booking records.</p><ol className="mt-5 space-y-2 text-sm"><li>1. Prepare this workspace’s connection.</li><li>2. Sign in to Google and approve access.</li><li>3. Verify test bookings before enabling live actions.</li></ol></section>
    {result.tenant?<AppointmentJourneyIntegrationCard tenant={result.tenant} message={message}/>:<section className="rounded-3xl bg-white p-8"><h3 className="text-xl font-semibold">Google Calendar &amp; Sheets</h3><p className="my-4 text-stone-600">Prepare setup here, then choose your Google account. This step does not create Google resources or make a booking.</p>{result.status===404?<PrepareGoogleConnector propertySlug={access.propertySlug}/>:<p role="alert">{result.error}</p>}</section>}
    <p className="text-sm text-stone-500">PMS, commerce and custom connectors require provider-specific verification. They are not activated by connecting Google.</p>
  </main></div>;
}
