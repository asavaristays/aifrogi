import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { hashCredentialPassword, verifyCredentialPassword } from "@/lib/credential-store";
import { SELF_SERVICE_REGISTRATION } from "@/lib/repositories/trial-registration-repository";

export type TeamRole = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";

function normalizeRole(value: string): TeamRole {
  const role = value.toUpperCase();
  return role === "OWNER" || role === "ADMIN" || role === "VIEWER" ? role : "AGENT";
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function listTeamMembers(organizationId: string) {
  const db = getDb();
  if (!db) return [];
  return db.organizationMember.findMany({
    where: { organizationId },
    select: { id: true, email: true, name: true, role: true, status: true, invitedAt: true, joinedAt: true, lastLoginAt: true, invitationExpiresAt: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });
}

export async function inviteTeamMember(input: { organizationId: string; email: string; name: string; role: string; invitedBy: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const role = normalizeRole(input.role);
  const member = await db.organizationMember.upsert({
    where: { organizationId_email: { organizationId: input.organizationId, email } },
    update: { name: input.name.trim() || null, role, status: "INVITED", invitationTokenHash: tokenHash(token), invitationExpiresAt: expiresAt, invitedBy: input.invitedBy, invitedAt: new Date() },
    create: { organizationId: input.organizationId, email, name: input.name.trim() || null, role, status: "INVITED", invitationTokenHash: tokenHash(token), invitationExpiresAt: expiresAt, invitedBy: input.invitedBy }
  });
  return { member, token, expiresAt };
}

export async function getInvitation(token: string) {
  const db = getDb();
  if (!db || !token) return null;
  return db.organizationMember.findUnique({
    where: { invitationTokenHash: tokenHash(token) },
    select: { id: true, email: true, name: true, role: true, status: true, invitedBy: true, invitationExpiresAt: true, organization: { select: { id: true, name: true, status: true } } }
  });
}

export async function activateInvitation(token: string, password: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const invitation = await getInvitation(token);
  if (!invitation || invitation.status !== "INVITED" || !invitation.invitationExpiresAt || invitation.invitationExpiresAt < new Date()) throw new Error("This invitation is invalid or has expired.");
  if (password.length < 10) throw new Error("Use at least 10 characters for your password.");
  return db.$transaction(async (tx) => {
    const member = await tx.organizationMember.update({
      where: { id: invitation.id },
      data: { passwordHash: hashCredentialPassword(password), status: "ACTIVE", joinedAt: new Date(), invitationTokenHash: null, invitationExpiresAt: null },
      select: { email: true, name: true, role: true, organizationId: true }
    });
    if (invitation.invitedBy === SELF_SERVICE_REGISTRATION) {
      await tx.organization.update({ where: { id: invitation.organization.id }, data: { status: "ONBOARDING" } });
      await tx.onboardingProfile.update({ where: { organizationId: invitation.organization.id }, data: { lifecycleStatus: "DRAFT", currentStep: 1, progressPercent: 10 } });
      await tx.onboardingActivity.create({ data: { organizationId: invitation.organization.id, actorEmail: invitation.email, action: "EMAIL_VERIFIED", detail: "Owner activated the trial workspace" } });
    }
    return { ...member, registration: invitation.invitedBy === SELF_SERVICE_REGISTRATION };
  });
}

export async function createTeamPasswordReset(emailInput: string, token: string, expiresAt: Date) {
  const db = getDb();
  if (!db) return false;
  const email = emailInput.trim().toLowerCase();
  const member = await db.organizationMember.findFirst({
    where: { email, status: "ACTIVE", passwordHash: { not: null } },
    select: { id: true }
  });
  if (!member) return false;
  await db.organizationMember.update({
    where: { id: member.id },
    data: { invitationTokenHash: tokenHash(token), invitationExpiresAt: expiresAt }
  });
  return true;
}

export async function getTeamPasswordReset(token: string) {
  const db = getDb();
  if (!db || !token) return null;
  const member = await db.organizationMember.findUnique({
    where: { invitationTokenHash: tokenHash(token) },
    select: { id: true, email: true, name: true, status: true, invitationExpiresAt: true, organization: { select: { name: true } } }
  });
  if (!member || member.status !== "ACTIVE" || !member.invitationExpiresAt || member.invitationExpiresAt < new Date()) return null;
  return member;
}

export async function resetTeamMemberPassword(token: string, password: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const member = await getTeamPasswordReset(token);
  if (!member) throw new Error("This password reset link is invalid or has expired.");
  if (password.length < 10) throw new Error("Use at least 10 characters for your password.");
  return db.organizationMember.update({
    where: { id: member.id },
    data: { passwordHash: hashCredentialPassword(password), invitationTokenHash: null, invitationExpiresAt: null },
    select: { email: true, name: true }
  });
}

export async function verifyTeamMemberCredential(email: string, password: string) {
  const db = getDb();
  if (!db || !email || !password) return null;
  const member = await db.organizationMember.findFirst({
    where: { email: email.trim().toLowerCase(), status: "ACTIVE", passwordHash: { not: null } },
    select: { id: true, email: true, name: true, role: true, passwordHash: true }
  });
  if (!member?.passwordHash || !verifyCredentialPassword(password, member.passwordHash)) return null;
  await db.organizationMember.update({ where: { id: member.id }, data: { lastLoginAt: new Date() } });
  return { username: member.email, label: member.name || "AiFrogi Team Member", workspaceRole: normalizeRole(member.role) };
}

export async function updateTeamMember(input: { organizationId: string; memberId: string; role?: string; status?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const member = await db.organizationMember.findFirst({ where: { id: input.memberId, organizationId: input.organizationId } });
  if (!member) throw new Error("Team member not found.");
  const nextRole = input.role ? normalizeRole(input.role) : normalizeRole(member.role);
  const nextStatus = input.status === "SUSPENDED" ? "SUSPENDED" : input.status === "ACTIVE" ? "ACTIVE" : member.status;
  if (member.role === "OWNER" && (nextRole !== "OWNER" || nextStatus !== "ACTIVE")) {
    const activeOwners = await db.organizationMember.count({ where: { organizationId: input.organizationId, role: "OWNER", status: "ACTIVE" } });
    if (activeOwners <= 1) throw new Error("Assign another active owner before changing this account.");
  }
  return db.organizationMember.update({ where: { id: member.id }, data: { role: nextRole, status: nextStatus }, select: { id: true, email: true, name: true, role: true, status: true, joinedAt: true, lastLoginAt: true } });
}
