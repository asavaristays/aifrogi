import { redirect } from "next/navigation";
import { getCurrentClientAccess, canManageWorkspace } from "@/lib/client-access";
export default async function Page(){
  const access=await getCurrentClientAccess();
  if(!access) redirect("/login?returnTo=%2Fin-stay%2Faccess");
  if(!canManageWorkspace(access.role)) redirect("/in-stay");
  redirect("/in-stay#qr-access");
}
