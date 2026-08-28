export type AppointmentTemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";
export type AppointmentTemplateStatus = "READY_FOR_META_SUBMISSION" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type AppointmentTemplateButtonType = "QUICK_REPLY" | "URL";

export type AppointmentTemplateVariable = {
  index: number;
  name: string;
  example: string;
};

export type AppointmentTemplateButton = {
  type: AppointmentTemplateButtonType;
  label: string;
  urlExample?: string;
};

export type AppointmentTemplate = {
  name: string;
  label: string;
  category: AppointmentTemplateCategory;
  languageCode: string;
  status: AppointmentTemplateStatus;
  body: string;
  variables: AppointmentTemplateVariable[];
  buttons: AppointmentTemplateButton[];
  useWhen: string;
  approvalRule: string;
  metaSubmissionNote: string;
};

const OUTSIDE_WINDOW_RULE = "Required when this message is sent outside the active WhatsApp customer-service window.";

export const RECOMMENDED_APPOINTMENT_TEMPLATES: AppointmentTemplate[] = [
  {
    name: "appointment_confirmation_v1",
    label: "Appointment confirmation",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send after the system confirms a booking and creates the Google Calendar event.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Hello {{1}}, your {{2}} appointment with {{3}} is confirmed for {{4}} at {{5}}. You can reply RESCHEDULE or CANCEL if you need to change it.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "service_name", example: "Consultation" },
      { index: 3, name: "business_name", example: "HotelRADAR" },
      { index: 4, name: "appointment_date", example: "6 July 2026" },
      { index: 5, name: "appointment_time", example: "9:00 AM" }
    ],
    buttons: [
      { type: "QUICK_REPLY", label: "Reschedule" },
      { type: "QUICK_REPLY", label: "Cancel" }
    ],
    metaSubmissionNote: "Keep as Utility. Do not add offers, discounts, or promotional copy."
  },
  {
    name: "appointment_payment_request_v1",
    label: "Appointment payment request",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send when the client requires advance payment before confirming a held slot.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Hello {{1}}, please complete payment of {{2}} for your {{3}} appointment with {{4}} on {{5}} at {{6}}. Your slot is held until {{7}}.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "amount", example: "INR 500" },
      { index: 3, name: "service_name", example: "Consultation" },
      { index: 4, name: "business_name", example: "HotelRADAR" },
      { index: 5, name: "appointment_date", example: "6 July 2026" },
      { index: 6, name: "appointment_time", example: "9:00 AM" },
      { index: 7, name: "hold_expiry", example: "8:45 AM" }
    ],
    buttons: [{ type: "URL", label: "Pay now", urlExample: "https://aifrogi.com/pay/booking_123" }],
    metaSubmissionNote: "Submit with a sample payment URL. Use only for a booking requested by the customer."
  },
  {
    name: "appointment_payment_received_v1",
    label: "Appointment payment received",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send after payment webhook marks the appointment payment as paid.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Thank you {{1}}. Payment of {{2}} has been received for your {{3}} appointment with {{4}} on {{5}} at {{6}}.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "amount", example: "INR 500" },
      { index: 3, name: "service_name", example: "Consultation" },
      { index: 4, name: "business_name", example: "HotelRADAR" },
      { index: 5, name: "appointment_date", example: "6 July 2026" },
      { index: 6, name: "appointment_time", example: "9:00 AM" }
    ],
    buttons: [],
    metaSubmissionNote: "This is a transactional receipt-style update. Avoid promotional add-ons."
  },
  {
    name: "appointment_reminder_24h_v1",
    label: "Appointment reminder - 24 hours",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send one day before a confirmed appointment.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Reminder: Hello {{1}}, your {{2}} appointment with {{3}} is tomorrow, {{4}}, at {{5}}. Reply RESCHEDULE or CANCEL if required.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "service_name", example: "Consultation" },
      { index: 3, name: "business_name", example: "HotelRADAR" },
      { index: 4, name: "appointment_date", example: "6 July 2026" },
      { index: 5, name: "appointment_time", example: "9:00 AM" }
    ],
    buttons: [
      { type: "QUICK_REPLY", label: "Reschedule" },
      { type: "QUICK_REPLY", label: "Cancel" }
    ],
    metaSubmissionNote: "Utility reminder tied to a confirmed appointment."
  },
  {
    name: "appointment_reminder_2h_v1",
    label: "Appointment reminder - 2 hours",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send two hours before a confirmed appointment.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Reminder: Hello {{1}}, your {{2}} appointment with {{3}} is today at {{4}}. Reply RESCHEDULE if you need another time.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "service_name", example: "Consultation" },
      { index: 3, name: "business_name", example: "HotelRADAR" },
      { index: 4, name: "appointment_time", example: "9:00 AM" }
    ],
    buttons: [{ type: "QUICK_REPLY", label: "Reschedule" }],
    metaSubmissionNote: "Keep concise and appointment-specific."
  },
  {
    name: "appointment_rescheduled_v1",
    label: "Appointment rescheduled",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send after a confirmed appointment is moved to a new slot.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Hello {{1}}, your {{2}} appointment with {{3}} has been rescheduled to {{4}} at {{5}}. Reply CANCEL if you cannot attend.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "service_name", example: "Consultation" },
      { index: 3, name: "business_name", example: "HotelRADAR" },
      { index: 4, name: "new_appointment_date", example: "7 July 2026" },
      { index: 5, name: "new_appointment_time", example: "11:30 AM" }
    ],
    buttons: [{ type: "QUICK_REPLY", label: "Cancel" }],
    metaSubmissionNote: "Use only when the customer or business has changed an existing booking."
  },
  {
    name: "appointment_cancelled_v1",
    label: "Appointment cancelled",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send after a booking is cancelled and the Google Calendar event is removed or marked cancelled.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Hello {{1}}, your {{2}} appointment with {{3}} scheduled for {{4}} at {{5}} has been cancelled.",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "service_name", example: "Consultation" },
      { index: 3, name: "business_name", example: "HotelRADAR" },
      { index: 4, name: "appointment_date", example: "6 July 2026" },
      { index: 5, name: "appointment_time", example: "9:00 AM" }
    ],
    buttons: [],
    metaSubmissionNote: "Transactional cancellation notice. Do not add a sales message."
  },
  {
    name: "appointment_feedback_request_v1",
    label: "Appointment feedback request",
    category: "UTILITY",
    languageCode: "en_US",
    status: "READY_FOR_META_SUBMISSION",
    useWhen: "Send after the appointment is completed, if the client wants feedback or a review link.",
    approvalRule: OUTSIDE_WINDOW_RULE,
    body: "Hello {{1}}, thank you for visiting {{2}} for your {{3}} appointment. Please share your feedback here: {{4}}",
    variables: [
      { index: 1, name: "customer_name", example: "Manish" },
      { index: 2, name: "business_name", example: "HotelRADAR" },
      { index: 3, name: "service_name", example: "Consultation" },
      { index: 4, name: "feedback_link", example: "https://g.page/r/example/review" }
    ],
    buttons: [{ type: "URL", label: "Share feedback", urlExample: "https://g.page/r/example/review" }],
    metaSubmissionNote: "Submit as Utility only when it is strictly post-appointment feedback. If Meta reclassifies it as Marketing, use the reclassified category."
  }
];

export function listRecommendedAppointmentTemplates() {
  return RECOMMENDED_APPOINTMENT_TEMPLATES;
}

export function getRecommendedAppointmentTemplate(name: string) {
  const normalized = name.trim().toLowerCase();
  return RECOMMENDED_APPOINTMENT_TEMPLATES.find((template) => template.name.toLowerCase() === normalized) || null;
}

export function listAppointmentTemplateSubmissionRows() {
  return RECOMMENDED_APPOINTMENT_TEMPLATES.map((template) => ({
    name: template.name,
    category: template.category,
    languageCode: template.languageCode,
    body: template.body,
    variables: template.variables.map((variable) => `${variable.index}. ${variable.name}: ${variable.example}`),
    buttons: template.buttons.map((button) => button.urlExample ? `${button.type}: ${button.label} (${button.urlExample})` : `${button.type}: ${button.label}`),
    note: template.metaSubmissionNote
  }));
}
