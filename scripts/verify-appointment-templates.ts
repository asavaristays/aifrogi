import {
  RECOMMENDED_APPOINTMENT_TEMPLATES,
  listAppointmentTemplateSubmissionRows
} from "@/lib/appointment-journey-templates";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const REQUIRED_TEMPLATES = [
  "appointment_confirmation_v1",
  "appointment_payment_request_v1",
  "appointment_payment_received_v1",
  "appointment_reminder_24h_v1",
  "appointment_reminder_2h_v1",
  "appointment_rescheduled_v1",
  "appointment_cancelled_v1",
  "appointment_feedback_request_v1"
];

const PROMOTIONAL_WORDS = [
  "discount",
  "offer",
  "sale",
  "limited time",
  "upgrade",
  "buy now",
  "deal",
  "coupon"
];

function placeholderIndexes(body: string) {
  const matches = body.match(/\{\{\d+\}\}/g) || [];
  return matches.map((match) => Number(match.replace(/\D/g, "")));
}

function main() {
  const names = new Set(RECOMMENDED_APPOINTMENT_TEMPLATES.map((template) => template.name));
  for (const required of REQUIRED_TEMPLATES) {
    assert(names.has(required), `${required} is missing from the appointment template pack.`);
  }

  for (const template of RECOMMENDED_APPOINTMENT_TEMPLATES) {
    assert(/^appointment_[a-z0-9_]+_v\d+$/.test(template.name), `${template.name} must use snake_case versioned naming.`);
    assert(template.category === "UTILITY", `${template.name} should start as a Utility template.`);
    assert(template.status === "READY_FOR_META_SUBMISSION", `${template.name} should not be marked approved before Meta approval.`);
    assert(template.languageCode === "en_US", `${template.name} language should be en_US.`);
    assert(template.body.length >= 20 && template.body.length <= 1024, `${template.name} body length is outside Meta-friendly bounds.`);

    const indexes = placeholderIndexes(template.body);
    const expectedIndexes = template.variables.map((variable) => variable.index);
    assert(indexes.length === expectedIndexes.length, `${template.name} placeholder count does not match variables.`);
    assert(indexes.every((index, offset) => index === offset + 1), `${template.name} placeholders must be sequential from {{1}}.`);
    assert(expectedIndexes.every((index, offset) => index === offset + 1), `${template.name} variable indexes must be sequential from 1.`);
    assert(new Set(template.variables.map((variable) => variable.name)).size === template.variables.length, `${template.name} has duplicate variable names.`);
    assert(template.variables.every((variable) => variable.example.trim().length > 0), `${template.name} has a missing variable example.`);
    assert(!PROMOTIONAL_WORDS.some((word) => template.body.toLowerCase().includes(word)), `${template.name} contains promotional wording.`);
  }

  const rows = listAppointmentTemplateSubmissionRows();
  assert(rows.length === RECOMMENDED_APPOINTMENT_TEMPLATES.length, "Submission rows do not cover all templates.");
  assert(rows.every((row) => row.body.includes("{{") && row.note), "Every submission row needs body placeholders and a note.");

  console.log("Appointment WhatsApp template pack verification passed.");
}

main();
