# Appointment Journey Flowchart

## 1. Product Activation And Setup

```mermaid
flowchart TD
    SA["Super Admin"] --> WA{"WhatsApp API connected?"}
    WA -- No --> WAC["Connect and validate Meta WhatsApp API"]
    WAC --> WA
    WA -- Yes --> EN["Enable Appointment Journey for workspace"]
    EN --> TENANT["Create AppointmentTenant and default service in Postgres"]
    TENANT --> ADMIN["Client Admin / Owner"]
    ADMIN --> GOOGLE["Connect Google account with OAuth"]
    GOOGLE --> RES["Create dedicated Google Calendar and four-tab Google Sheet"]
    RES --> READY["Store encrypted refresh token, calendar ID and sheet ID"]
    READY --> LIVE["Tenant status becomes GOOGLE_READY"]
    LIVE --> TEST["Send live WhatsApp test booking"]
```

## 2. Roles And Responsibilities

```mermaid
flowchart LR
    SA["Super Admin"] -->|"Connect check, enable, disable, monitor"| PLATFORM["AiFrogi Platform"]
    CA["Client Admin / Owner"] -->|"Google OAuth, services, hours, review link"| PLATFORM
    CUSTOMER["WhatsApp Customer"] -->|"Service, name, slot, payment, feedback"| PLATFORM

    PLATFORM --> DB["Postgres source of truth"]
    PLATFORM --> META["Meta WhatsApp Cloud API"]
    PLATFORM --> GCAL["Google Calendar"]
    PLATFORM --> GSHEET["Google Sheet"]
```

| Role | Main controls |
| --- | --- |
| Super Admin | Verify WhatsApp connection, enable or disable Appointment Journey, initiate Google connection for legacy workspaces, monitor readiness. |
| Client Admin / Owner | Authorize Google, maintain services and working hours, view Calendar and Sheet, handle exceptions. |
| Customer | Start booking in WhatsApp, choose service and slot, pay when enabled, reschedule, cancel, and submit feedback. |

## 3. Real-Time WhatsApp Booking Workflow

```mermaid
flowchart TD
    C["Customer sends WhatsApp message"] --> META["Meta webhook reaches AiFrogi"]
    META --> VERIFY["Verify Meta signature and resolve phone number to workspace"]
    VERIFY --> ENABLED{"Appointment Journey enabled and GOOGLE_READY?"}
    ENABLED -- No --> GENERAL["Continue normal AiFrogi bot / inbox workflow"]
    ENABLED -- Yes --> DEDUPE["Deduplicate by WhatsApp message ID"]
    DEDUPE --> SESSION["Load session by tenant and customer phone"]
    SESSION --> SERVICE["Send numbered service options"]
    SERVICE --> NAME["Collect customer name"]
    NAME --> AVAIL["Read working hours and Google Calendar free/busy"]
    AVAIL --> SLOTS["Send available slot options"]
    SLOTS --> HOLD["Create Postgres booking hold"]
    HOLD --> GCALHOLD["Create tentative Google Calendar event"]
    GCALHOLD --> PAYMENT{"Payment enabled?"}
    PAYMENT -- No --> CONFIRM["Confirm booking"]
    PAYMENT -- Yes --> LINK["Create and send Razorpay payment link"]
    LINK --> PAID{"Signed payment webhook received?"}
    PAID -- Yes --> CONFIRM
    PAID -- Timeout --> EXPIRE["Expire booking and delete Calendar hold"]
    CONFIRM --> DB["Update booking as CONFIRMED in Postgres"]
    DB --> GCAL["Update Calendar event as confirmed"]
    DB --> SHEET["Queue Bookings-tab synchronization"]
    DB --> JOBS["Create reminder and review jobs"]
    GCAL --> REPLY["Send WhatsApp confirmation"]
    SHEET --> REPLY
    JOBS --> REPLY
```

## 4. Data Storage And Google Synchronization

```mermaid
flowchart LR
    WHATSAPP["WhatsApp events"] --> ENGINE["Appointment Engine"]
    ENGINE --> DB[("Postgres")]

    DB -->|"Confirmed booking, reschedule, cancellation"| CALQ["Calendar sync operation"]
    CALQ --> CAL["Google Calendar event"]
    CAL -->|"Event ID and sync status"| DB

    DB -->|"Booking and feedback changes"| SHEETQ["Sheet sync job"]
    SHEETQ --> BOOKINGS["Bookings tab"]
    SHEETQ --> FEEDBACK["Feedback tab"]

    SETTINGS["Settings tab"] -->|"Validated pull"| DB
    SERVICES["Services tab"] -->|"Validated pull"| DB
```

### Google Sheet tabs

| Tab | Direction | Data |
| --- | --- | --- |
| Settings | Google Sheet to Postgres | Working hours, payment setting, review link. |
| Services | Google Sheet to Postgres | Service name, duration, price, active status. |
| Bookings | Postgres to Google Sheet | Customer, phone, service, slot, booking and payment status. |
| Feedback | Postgres to Google Sheet | Rating, comments, review routing and timestamps. |

## 5. Write Safety Rules

1. Postgres is always the source of truth.
2. Every inbound WhatsApp message is deduplicated by provider message ID.
3. Calendar events store their Google event ID on the booking record.
4. Sheet writes run asynchronously and never delay the WhatsApp reply.
5. Failed Google operations retry through deterministic jobs and retain the last error.
6. Disabling Appointment Journey immediately stops new appointment routing without deleting client data or Google credentials.

## 6. Current Implementation Boundary

Implemented now:

- Super Admin workspace enable and disable control.
- WhatsApp readiness enforcement and live Meta routing.
- Google OAuth, Calendar creation, Sheet creation, and encrypted token storage.
- WhatsApp service/name/slot conversation and Postgres booking persistence.
- Google Calendar free/busy lookup, event creation, and cancellation deletion.
- Google Sheet header initialization and Bookings-tab ledger appends.

Still required for the complete production workflow:

- Calendar reschedule updates and paid-hold promotion.
- Feedback tab synchronization.
- Settings and Services tab pull synchronization.
- Razorpay payment links/webhooks, reminder jobs, and review jobs.
- Per-client Meta Utility-template approval for confirmation, payment, reminders, and review requests.
