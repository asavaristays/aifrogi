/** Shared production/test template. No visitor PII or bearer credentials in email. */
export function websiteHandoverEmail(overdue: boolean, test = false) {
  const heading = overdue ? "An AI Bot human-help request is overdue" : "A visitor needs human help";
  const marker = test ? "TEST ONLY — no client action is required. Please confirm receipt.\n\n" : "";
  return {
    subject: `${test ? "[TEST] " : ""}${heading} — AiFrogi`,
    body: `${marker}${heading}.\n\nReview the visitor conversation in your AI Bot inbox:\nhttps://app.aifrogi.com/whatsapp-bot\n\nThis is an asynchronous request, not a promise that a human has joined. Reply from the inbox, not by email. No visitor contact details are included.\n\nAiFrogi · info@aifrogi.com · +91-7410582898`,
    html: `<div style="font-family:Arial,sans-serif;background:#f3f3f3;padding:24px"><div style="background:#050505;padding:20px"><img alt="AiFrogi" width="155" src="https://app.aifrogi.com/brand/aifrogi-logo-white.png"></div><div style="background:white;padding:24px">${test ? "<p>TEST ONLY — no client action is required. Please confirm receipt.</p>" : ""}<h2>${heading}</h2><p>Review the visitor conversation in your AI Bot inbox.</p><a href="https://app.aifrogi.com/whatsapp-bot">Open AI Bot inbox</a><p>Reply from the inbox, not by email. This notification does not mean a human has joined.</p></div><p style="color:#666">AiFrogi · info@aifrogi.com · +91-7410582898</p></div>`
  };
}
