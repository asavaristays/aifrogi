export function guardWebsiteVisitorMessage(message: string) {
  const hasCard = /(?:\d[ -]?){13,19}/.test(message);
  const hasOtp = /\b(?:otp|one[ -]?time password|verification code)\b\s*[:=-]?\s*\d{4,8}\b/i.test(message);
  const hasPassword = /\b(?:password|passwd|pwd)\b\s*[:=-]\s*\S{4,}/i.test(message);
  const hasPromptOrSecretProbe = /\b(system prompt|developer prompt|api key|secret key|access token|show (?:me )?(?:your|the) (?:prompt|instructions|credentials|secrets)|ignore (?:all |your |the )?(?:previous|prior|system|developer) (?:instructions|rules|prompt))\b/i.test(message);
  const hasCrossTenantProbe = /\b(all (?:customers|bookings|conversations)|another (?:customer|client|tenant)|other (?:customer|client|tenant)s?|customer before me|competitor.{0,30}(?:price|data|booking|conversation))\b/i.test(message);
  if (!hasCard && !hasOtp && !hasPassword && !hasPromptOrSecretProbe && !hasCrossTenantProbe) return { blocked: false, storageText: message, answer: null as string | null, safetyClassification: "STANDARD" as const };
  if (hasPromptOrSecretProbe || hasCrossTenantProbe) return {
    blocked: true,
    storageText: message.slice(0, 1200),
    answer: hasCrossTenantProbe
      ? "I can only use information approved for this business and this conversation. I cannot access or disclose another customer’s, competitor’s, or workspace’s information."
      : "I cannot reveal or override system instructions, credentials, secrets, or security controls. I can still help with an approved Webtechnosys business question.",
    safetyClassification: hasCrossTenantProbe ? "CROSS_TENANT_PROBE" as const : "PROMPT_OR_SECRET_PROBE" as const
  };
  return {
    blocked: true,
    storageText: "[Sensitive credential or payment data withheld by AiFrogi]",
    answer: "For your security, I did not process or retain the credential or payment information in that message. Please do not share passwords, OTPs, verification codes, or card details here. I can still help if you describe the business requirement without sensitive data.",
    safetyClassification: "SENSITIVE_CREDENTIAL" as const
  };
}
