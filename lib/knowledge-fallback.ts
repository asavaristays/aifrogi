export type UnavailableKnowledgeState = "CONFLICT" | "FLAGGED" | "EXPIRED" | "PAUSED";

export function unavailableKnowledgeMessage(state: UnavailableKnowledgeState, businessName: string) {
  const messages = {
    CONFLICT: `The approved ${businessName} information for this topic is being verified because two versions conflict. I will not guess or serve an older disputed value. Please use the human-contact option for confirmation.`,
    FLAGGED: `This ${businessName} information was flagged as potentially incorrect and is paused for review. Please use the human-contact option for a verified answer.`,
    EXPIRED: `This ${businessName} information has reached its review date and is awaiting reconfirmation. Please use the human-contact option for current information.`,
    PAUSED: `This ${businessName} information is temporarily unavailable while the business team reviews it. Please use the human-contact option for confirmation.`
  } as const;
  return messages[state];
}
