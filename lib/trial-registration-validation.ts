const PLACEHOLDER_WORDS = new Set(["abc", "asdf", "demo", "dummy", "fake", "none", "null", "qwerty", "sample", "test", "testing", "unknown", "xyz"]);
const DISPOSABLE_DOMAINS = new Set(["10minutemail.com", "guerrillamail.com", "mailinator.com", "tempmail.com", "yopmail.com"]);

function words(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

export function validateTrialIdentity(input: { companyName: string; ownerName: string; ownerEmail: string; ownerMobile: string; website?: string }) {
  const companyWords = words(input.companyName);
  const ownerWords = words(input.ownerName);
  if (!companyWords.length || companyWords.every((word) => PLACEHOLDER_WORDS.has(word) || /^\d+$/.test(word))) return "Enter your real business name; placeholder or test names are not accepted.";
  if (!ownerWords.length || ownerWords.every((word) => PLACEHOLDER_WORDS.has(word) || /^\d+$/.test(word))) return "Enter the real account owner name; placeholder or test names are not accepted.";
  const [local = "", domain = ""] = input.ownerEmail.toLowerCase().split("@");
  if (!local || !domain || PLACEHOLDER_WORDS.has(local) || /^(test|dummy|fake)[+._-]/.test(local) || DISPOSABLE_DOMAINS.has(domain)) return "Use a genuine email address you can verify; test and temporary email addresses are not accepted.";
  const mobile = normalizeRegistrationMobile(input.ownerMobile);
  if (mobile.length < 10 || mobile.length > 15 || /^(\d)\1+$/.test(mobile) || /1234567890$/.test(mobile)) return "Enter a genuine mobile number for account and support contact.";
  if (input.website) {
    const hostname = new URL(input.website).hostname.toLowerCase().replace(/^www\./, "");
    if (["example.com", "example.org", "example.net", "localhost"].includes(hostname) || hostname.endsWith(".test") || hostname.endsWith(".invalid")) return "Enter your real public business website, or leave the website blank.";
  }
  return null;
}

export function normalizeRegistrationMobile(value: string) {
  return value.replace(/\D/g, "");
}
