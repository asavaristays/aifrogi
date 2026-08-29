export function guardWebsiteVisitorMessage(message: string) {
  const hasCard = /(?:\d[ -]?){13,19}/.test(message);
  const hasOtp = /\b(?:otp|one[ -]?time password|verification code)\b\s*[:=-]?\s*\d{4,8}\b/i.test(message);
  const hasPassword = /\b(?:password|passwd|pwd)\b\s*[:=-]\s*\S{4,}/i.test(message);
  if (!hasCard && !hasOtp && !hasPassword) return { blocked: false, storageText: message, answer: null as string | null };
  return {
    blocked: true,
    storageText: "[Sensitive credential or payment data withheld by AiFrogi]",
    answer: "For your security, I did not process or retain the credential or payment information in that message. Please do not share passwords, OTPs, verification codes, or card details here. I can still help if you describe the business requirement without sensitive data."
  };
}
