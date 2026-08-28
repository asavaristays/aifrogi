# Appointment Journey WhatsApp Template Pack

Date: 2026-07-05
Owner: Super Admin
Status: Ready for Meta submission

## Operating Rule

Appointment Journey can reply freely when the customer starts the WhatsApp conversation and the reply is inside the active 24-hour customer-service window.

Approved Meta templates are required for proactive outbound messages, especially reminders, payment nudges, reschedule notices, cancellation notices, and feedback requests sent outside that window.

If every client has their own WhatsApp Business Account, submit and approve this template pack separately inside each client WABA. If AiFrogi uses one central WABA for all clients, the same approved templates can be reused, but branding and compliance become shared.

## Recommended Templates

| Template name | Category | When used | Buttons |
|---|---|---|---|
| `appointment_confirmation_v1` | Utility | Booking confirmed and Google Calendar event created | Reschedule, Cancel |
| `appointment_payment_request_v1` | Utility | Payment required before slot confirmation | Pay now |
| `appointment_payment_received_v1` | Utility | Payment webhook marks payment paid | None |
| `appointment_reminder_24h_v1` | Utility | One day before confirmed appointment | Reschedule, Cancel |
| `appointment_reminder_2h_v1` | Utility | Two hours before confirmed appointment | Reschedule |
| `appointment_rescheduled_v1` | Utility | Existing appointment moved to a new slot | Cancel |
| `appointment_cancelled_v1` | Utility | Booking cancelled | None |
| `appointment_feedback_request_v1` | Utility candidate | After completed appointment | Share feedback |

## Submission Copy

### appointment_confirmation_v1

Body:

```text
Hello {{1}}, your {{2}} appointment with {{3}} is confirmed for {{4}} at {{5}}. You can reply RESCHEDULE or CANCEL if you need to change it.
```

Variables: `customer_name`, `service_name`, `business_name`, `appointment_date`, `appointment_time`

Sample values: `Manish`, `Consultation`, `HotelRADAR`, `6 July 2026`, `9:00 AM`

Buttons: `Reschedule`, `Cancel`

### appointment_payment_request_v1

Body:

```text
Hello {{1}}, please complete payment of {{2}} for your {{3}} appointment with {{4}} on {{5}} at {{6}}. Your slot is held until {{7}}.
```

Variables: `customer_name`, `amount`, `service_name`, `business_name`, `appointment_date`, `appointment_time`, `hold_expiry`

Sample values: `Manish`, `INR 500`, `Consultation`, `HotelRADAR`, `6 July 2026`, `9:00 AM`, `8:45 AM`

Button: `Pay now`

### appointment_payment_received_v1

Body:

```text
Thank you {{1}}. Payment of {{2}} has been received for your {{3}} appointment with {{4}} on {{5}} at {{6}}.
```

Variables: `customer_name`, `amount`, `service_name`, `business_name`, `appointment_date`, `appointment_time`

Sample values: `Manish`, `INR 500`, `Consultation`, `HotelRADAR`, `6 July 2026`, `9:00 AM`

### appointment_reminder_24h_v1

Body:

```text
Reminder: Hello {{1}}, your {{2}} appointment with {{3}} is tomorrow, {{4}}, at {{5}}. Reply RESCHEDULE or CANCEL if required.
```

Variables: `customer_name`, `service_name`, `business_name`, `appointment_date`, `appointment_time`

Sample values: `Manish`, `Consultation`, `HotelRADAR`, `6 July 2026`, `9:00 AM`

Buttons: `Reschedule`, `Cancel`

### appointment_reminder_2h_v1

Body:

```text
Reminder: Hello {{1}}, your {{2}} appointment with {{3}} is today at {{4}}. Reply RESCHEDULE if you need another time.
```

Variables: `customer_name`, `service_name`, `business_name`, `appointment_time`

Sample values: `Manish`, `Consultation`, `HotelRADAR`, `9:00 AM`

Button: `Reschedule`

### appointment_rescheduled_v1

Body:

```text
Hello {{1}}, your {{2}} appointment with {{3}} has been rescheduled to {{4}} at {{5}}. Reply CANCEL if you cannot attend.
```

Variables: `customer_name`, `service_name`, `business_name`, `new_appointment_date`, `new_appointment_time`

Sample values: `Manish`, `Consultation`, `HotelRADAR`, `7 July 2026`, `11:30 AM`

Button: `Cancel`

### appointment_cancelled_v1

Body:

```text
Hello {{1}}, your {{2}} appointment with {{3}} scheduled for {{4}} at {{5}} has been cancelled.
```

Variables: `customer_name`, `service_name`, `business_name`, `appointment_date`, `appointment_time`

Sample values: `Manish`, `Consultation`, `HotelRADAR`, `6 July 2026`, `9:00 AM`

### appointment_feedback_request_v1

Body:

```text
Hello {{1}}, thank you for visiting {{2}} for your {{3}} appointment. Please share your feedback here: {{4}}
```

Variables: `customer_name`, `business_name`, `service_name`, `feedback_link`

Sample values: `Manish`, `HotelRADAR`, `Consultation`, `https://g.page/r/example/review`

Button: `Share feedback`

Meta note: submit as Utility only when this is strictly post-appointment feedback. If Meta reclassifies it as Marketing, use the reclassified category.

## Super Admin Enablement Flow

1. Enable Appointment Journey for the client workspace.
2. Confirm WhatsApp API is connected and healthy.
3. Submit this template pack in the client WABA or central AiFrogi WABA.
4. Wait until template status is approved in Meta.
5. Map approved template names to Appointment Journey events.
6. Admin connects Google OAuth, Calendar, Sheet, services, payment API, validity, and booking rules.
7. Run inbound sandbox booking.
8. Run one template send test for reminders/payment/cancellation.

## Compliance Guardrails

- Keep all appointment templates Utility unless Meta reclassifies a specific use case.
- Do not add discounts, offers, cross-sell text, or marketing language.
- Use templates only for customers with a real appointment or a customer-initiated booking/payment action.
- Store the Meta template status per WABA and language.
- Block production scheduled sends until the selected template is approved.
