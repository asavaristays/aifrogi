import { getCurrentUser } from "@/lib/auth-server";
import { getOnboardingDocument } from "@/lib/repositories/onboarding-repository";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const document = await getOnboardingDocument(id);
  const canRead = user.role === "admin" || document?.organization.members.some(
    (member) => member.status === "ACTIVE" && member.email === user.username.toLowerCase()
  );

  if (!document || !canRead) {
    return new Response("Document not found", { status: 404 });
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
