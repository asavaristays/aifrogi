import { LeadLanguage, LeadStage } from "../generated/prisma/enums";
import type { LeadInput } from "@/types";

function toInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function toStage(stage: string): LeadStage {
  const normalized = stage.trim().toUpperCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "NEW":
      return LeadStage.NEW;
    case "CONTACTED":
      return LeadStage.CONTACTED;
    case "QUALIFIED":
      return LeadStage.QUALIFIED;
    case "PROPOSAL_SENT":
    case "PROPOSAL":
      return LeadStage.PROPOSAL_SENT;
    case "BOOKED":
      return LeadStage.BOOKED;
    case "LOST":
      return LeadStage.LOST;
    default:
      return LeadStage.NEW;
  }
}

function toLanguage(language: "HI" | "EN") {
  return language === "HI" ? LeadLanguage.HI : LeadLanguage.EN;
}

export function normalizeLeadInput(input: LeadInput) {
  return {
    name: input.name.trim(),
    initials: toInitials(input.name),
    source: input.source.trim(),
    stage: toStage(input.stage),
    language: toLanguage(input.language),
    intent: input.intent.trim(),
    stayLabel: input.stay.trim(),
    partyLabel: input.party.trim(),
    budgetLabel: input.budget.trim(),
    phone: input.phone.trim(),
    score: Number(input.score),
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    isHighPriority: Boolean(input.isHighPriority)
  };
}

export function validateLeadInput(input: Partial<LeadInput>) {
  const required = ["name", "source", "stage", "language", "intent", "stay", "party", "budget", "phone"] as const;

  for (const field of required) {
    if (!input[field] || String(input[field]).trim() === "") {
      return `${field} is required`;
    }
  }

  if (typeof input.score !== "number" || Number.isNaN(input.score)) {
    return "score must be a valid number";
  }

  if (input.score < 0 || input.score > 100) {
    return "score must be between 0 and 100";
  }

  if (input.language !== "HI" && input.language !== "EN") {
    return "language must be HI or EN";
  }

  return null;
}
