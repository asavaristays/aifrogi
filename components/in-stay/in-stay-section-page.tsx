import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { InStayWorkspace } from "@/components/in-stay/in-stay-workspace";
import { getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

type View = "queries" | "complaints" | "resolved" | "reports";

export async function InStaySectionPage({ view }: { view: View }) {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  if (!access) redirect("/login");
  if (access.organization.botProfile?.category !== "STAY") redirect("/setup");
  const property = access.organization.properties.find((item) => item.slug === propertySlug) || access.organization.properties[0];
  if (!property) redirect("/setup");
  return <div className="min-h-screen bg-[var(--background)]"><TopBar title="In-stay" subtitle="Guest service operations"/><div className="px-4 py-6 sm:px-6 lg:px-8"><InStayWorkspace propertySlug={property.slug} view={view} canManage={["OWNER","ADMIN"].includes(access.role)}/></div></div>;
}
