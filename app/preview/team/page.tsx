import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TeamAccessManager } from "@/components/settings/team-access-manager";

export default function TeamPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const now = new Date().toISOString();
  return <AppShell workspaces={[{ id: "preview", name: "AiFrogi Demo", slug: "hotelradar", status: "CONNECTED", displayPhoneNumber: "+91 70589 63898" }]} currentWorkspaceSlug="hotelradar" accessRole="OWNER"><TeamAccessManager organizationName="HotelRadar AI Agency" currentEmail="support@hotelradar.in" initialMembers={[
    { id: "owner", email: "support@hotelradar.in", name: "HotelRadar Support", role: "OWNER", status: "ACTIVE", invitedAt: now, joinedAt: now, lastLoginAt: now, invitationExpiresAt: null },
    { id: "agent", email: "sales@hotelradar.in", name: "Sales Desk", role: "AGENT", status: "ACTIVE", invitedAt: now, joinedAt: now, lastLoginAt: null, invitationExpiresAt: null },
    { id: "invite", email: "operations@hotelradar.in", name: "Operations", role: "VIEWER", status: "INVITED", invitedAt: now, joinedAt: null, lastLoginAt: null, invitationExpiresAt: now }
  ]} /></AppShell>;
}

