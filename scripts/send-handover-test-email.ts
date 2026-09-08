import { sendBookingMail } from "../lib/services/mailbox-service";
import { websiteHandoverEmail } from "../lib/website-handover-email";

async function main() {
  if (process.argv[2] !== "--approved-info-webtechnosys") throw new Error("Requires the explicitly approved test recipient flag");
  const result = await sendBookingMail({ to: "info@webtechnosys.com", ...websiteHandoverEmail(false, true) });
  if (result.error || !result.messageId) throw new Error("Test email not accepted by SMTP");
  console.log(JSON.stringify({ recipient: "info@webtechnosys.com", smtpAccepted: true, inboxReceiptVerified: false, messageId: result.messageId }));
}
main().catch(() => { console.error("Test email send failed; SMTP acceptance not confirmed."); process.exitCode = 1; });
