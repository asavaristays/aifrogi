import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerOnboarding } from "@/components/onboarding/customer-onboarding";
import { getCurrentUser } from "@/lib/auth-server";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Account onboarding | AiFrogi", robots: { index: false, follow: false } };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/customers");

  const organization = await loadOnboardingForUser(user.username);
  return (
    <CustomerOnboarding
      initialOrganization={organization}
      accountEmail={user.username}
    />
  );
}
