import { getCurrentUser } from "@/lib/auth-server";
import { getOnboardingDocument } from "@/lib/repositories/onboarding-repository";
import { hasActiveSupportAccess, logSupportDataAccess } from "@/lib/support-access";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const document = await getOnboardingDocument(id);
  const customerMemberCanRead = document?.organization.members.some(
    (member) => member.status === "ACTIVE" && member.email === user.username.toLowerCase()
  );
  const adminCanRead = user.role === "admin" && document ? await hasActiveSupportAccess(document.organizationId, "DOCUMENTS") : false;
  const canRead = Boolean(customerMemberCanRead || adminCanRead);

  if (!document || !canRead) {
    if (document && user.role === "admin") {
      await logSupportDataAccess({
        organizationId: document.organizationId,
        actorEmail: user.username,
        scope: "DOCUMENTS",
        targetType: "ONBOARDING_DOCUMENT",
        targetId: document.id,
        granted: false,
        summary: "Support document download blocked because customer access was not granted."
      });
    }
    return new Response("Document not found", { status: 404 });
  }

  if (user.role === "admin") {
    await logSupportDataAccess({
      organizationId: document.organizationId,
      actorEmail: user.username,
      scope: "DOCUMENTS",
      targetType: "ONBOARDING_DOCUMENT",
      targetId: document.id,
      granted: true,
      summary: "Support downloaded a customer onboarding document."
    });
  }

  const safeFileName = document.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_");

  return new Response(document.content, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${safeFileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
