import { redirect } from "next/navigation";
import { HotelGptQuickRepliesManager } from "@/components/settings/hotelgpt-quick-replies-manager";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export default async function Page(){const access=await getCurrentClientAccess();if(!access)redirect("/login?returnTo=%2Fsettings%2Fguest-communication%2Fsaved-replies");if(access.organization.botProfile?.category!=="STAY")redirect("/settings");const settings=await readKnowledgeSettings(await getCurrentWorkspaceSlug());return <main className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8"><nav className="text-sm"><a href="/settings" className="font-bold">Settings</a> → Guest communication → Saved replies</nav><HotelGptQuickRepliesManager initialReplies={(settings.hotelQuickReplies||[]).filter(item=>item.journey==="PRE_STAY")} canManage={canManageWorkspace(access.role)}/></main>;}
