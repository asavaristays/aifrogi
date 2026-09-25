import { redirect } from "next/navigation";
import { getCurrentClientAccess } from "@/lib/client-access";
import { DepartmentMobileWorkspace } from "@/components/in-stay/department-mobile-workspace";

export default async function InStayTeamPage(){
  const access=await getCurrentClientAccess();
  if(!access) redirect("/login");
  if(access.organization.botProfile?.category!=="STAY") redirect("/dashboard");
  if(!access.department) redirect("/in-stay");
  const property=access.organization.properties[0];
  if(!property) redirect("/onboarding");
  return <DepartmentMobileWorkspace propertySlug={property.slug} department={access.department} username={access.user.username}/>;
}
