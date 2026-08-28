from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "appointment-journey-hotelradar-test-guidebook.pdf"


def add_page_number(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(colors.HexColor("#5a4fc7"))
    canvas.rect(0, height - 11 * mm, width, 11 * mm, stroke=0, fill=1)
    canvas.rect(0, 0, width, 9 * mm, stroke=0, fill=1)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(18 * mm, height - 7 * mm, "Appointment Journey - HotelRADAR Test Guidebook")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 18 * mm, 4 * mm, f"Page {doc.page}")
    canvas.restoreState()


def styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=31,
            textColor=colors.HexColor("#15131f"),
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#4b5563"),
            spaceAfter=14,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#2f2a5f"),
            spaceBefore=10,
            spaceAfter=7,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=colors.HexColor("#15131f"),
            spaceBefore=8,
            spaceAfter=5,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=13.5,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#4b5563"),
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=13.2,
            leftIndent=10,
            firstLineIndent=-7,
            bulletIndent=0,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=4,
        ),
        "code": ParagraphStyle(
            "Code",
            fontName="Courier",
            fontSize=7.1,
            leading=9.2,
            textColor=colors.HexColor("#111827"),
            backColor=colors.HexColor("#f3f4f6"),
            borderPadding=6,
            leftIndent=0,
            rightIndent=0,
            spaceBefore=4,
            spaceAfter=8,
        ),
    }


def p(text, style):
    return Paragraph(text, style)


def bullet(text, style):
    return Paragraph(text, style, bulletText="-")


def code(text, style):
    return Preformatted(text.strip(), style)


def table(rows, widths):
    s = styles()
    wrapped_rows = []
    for row_index, row in enumerate(rows):
        next_row = []
        for value in row:
            if isinstance(value, str):
                style = s["small"]
                if row_index == 0:
                    style = ParagraphStyle(
                        "TableHeader",
                        parent=s["small"],
                        fontName="Helvetica-Bold",
                        textColor=colors.HexColor("#2f2a5f"),
                    )
                next_row.append(Paragraph(escape(value), style))
            else:
                next_row.append(value)
        wrapped_rows.append(next_row)
    t = Table(wrapped_rows, colWidths=widths, hAlign="LEFT", repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eeeefa")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#2f2a5f")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.1),
                ("LEADING", (0, 0), (-1, -1), 10.5),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d7d7e5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fbfbfe")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=20 * mm,
        bottomMargin=16 * mm,
        title="Appointment Journey HotelRADAR Test Guidebook",
        author="AiFrogi",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=add_page_number)])
    s = styles()
    story = []

    story += [
        p("Appointment Journey", s["title"]),
        p("HotelRADAR Test Guidebook", s["title"]),
        p(
            "Exact test flow for validating the WhatsApp appointment automation product using the existing HotelRADAR workspace. Prepared July 5, 2026.",
            s["subtitle"],
        ),
        table(
            [
                ["Item", "Value"],
                ["Workspace slug", "hotelradar"],
                ["Workspace name", "HotelRADAR"],
                ["Local URL", "http://localhost:3000/settings/integrations"],
                ["Production redirect URI", "https://aifrogi.com/api/appointment-journey/google/oauth/callback"],
                ["Local redirect URI", "http://localhost:3000/api/appointment-journey/google/oauth/callback"],
            ],
            [48 * mm, 120 * mm],
        ),
        Spacer(1, 8),
        p("Testing Principle", s["h1"]),
        p(
            "Use one AiFrogi Google OAuth client for the platform. Each client connects their own Google account. The refresh token and created Google resource IDs are stored per AppointmentTenant in AiFrogi Postgres.",
            s["body"],
        ),
        bullet("Postgres is the source of truth for tenants, services, bookings, sessions, logs, payments, and jobs.", s["bullet"]),
        bullet("Google Calendar stores operational appointment events and holds for the connected client.", s["bullet"]),
        bullet("Google Sheets stores a human-friendly mirror with Settings, Services, Bookings, and Feedback tabs.", s["bullet"]),
        bullet("AiFrogi remains the owner of WhatsApp and Meta plumbing. Appointment Journey receives normalized signed events.", s["bullet"]),
    ]

    story += [
        PageBreak(),
        p("1. Choose The Test Mode", s["h1"]),
        table(
            [
                ["Mode", "When to use", "Required Google redirect URI"],
                ["Local browser test", "Best for current development on your Mac.", "http://localhost:3000/api/appointment-journey/google/oauth/callback"],
                ["Production-domain test", "Best after deployment to the live AiFrogi domain.", "https://aifrogi.com/api/appointment-journey/google/oauth/callback"],
            ],
            [38 * mm, 70 * mm, 62 * mm],
        ),
        p("Important: Google OAuth redirect URIs must match exactly. If you test locally, add the localhost redirect URI in Google Cloud and set GOOGLE_APPOINTMENT_REDIRECT_URI to the localhost value.", s["body"]),
        p("2. Google Cloud Checklist", s["h1"]),
        bullet("OAuth client type: Web application.", s["bullet"]),
        bullet("Authorized JavaScript origin for production: https://aifrogi.com.", s["bullet"]),
        bullet("Authorized JavaScript origin for local: http://localhost:3000, only if testing locally.", s["bullet"]),
        bullet("Authorized redirect URI for production: https://aifrogi.com/api/appointment-journey/google/oauth/callback.", s["bullet"]),
        bullet("Authorized redirect URI for local: http://localhost:3000/api/appointment-journey/google/oauth/callback.", s["bullet"]),
        bullet("Google Auth Platform test users: add the Google account you will use to connect HotelRADAR.", s["bullet"]),
        bullet("Enable APIs: Google Calendar API, Google Sheets API, and Google Drive API.", s["bullet"]),
        p("OAuth scopes used by Appointment Journey:", s["h2"]),
        code(
            """
https://www.googleapis.com/auth/calendar.app.created
https://www.googleapis.com/auth/calendar.freebusy
https://www.googleapis.com/auth/drive.file
            """,
            s["code"],
        ),
    ]

    story += [
        p("3. Local Environment", s["h1"]),
        p("For local testing, keep HotelRADAR as the default workspace and use localhost as the OAuth callback.", s["body"]),
        code(
            """
LEADOS_DEFAULT_PROPERTY_SLUG="hotelradar"
PUBLIC_BASE_URL="http://localhost:3000"
GOOGLE_APPOINTMENT_CLIENT_ID="paste-client-id"
GOOGLE_APPOINTMENT_CLIENT_SECRET="paste-client-secret"
GOOGLE_APPOINTMENT_REDIRECT_URI="http://localhost:3000/api/appointment-journey/google/oauth/callback"
APPOINTMENT_JOURNEY_HMAC_SECRET="use-a-strong-random-secret"
APPOINTMENT_JOURNEY_INTERNAL_TOKEN="use-a-strong-random-token"
            """,
            s["code"],
        ),
        p("For production-domain testing, change the redirect URI and public base URL to the deployed AiFrogi domain you have configured in Google Cloud.", s["body"]),
        code(
            """
PUBLIC_BASE_URL="https://aifrogi.com"
GOOGLE_APPOINTMENT_REDIRECT_URI="https://aifrogi.com/api/appointment-journey/google/oauth/callback"
            """,
            s["code"],
        ),
        p("Because this repository uses Prisma config that may not auto-load .env.local, pass DATABASE_URL explicitly for Prisma commands if needed.", s["body"]),
        code(
            """
DATABASE_URL="postgresql://USER@localhost:5432/lead_os_ai?schema=public" npm run db:push
DATABASE_URL="postgresql://USER@localhost:5432/lead_os_ai?schema=public" npm run db:seed
npm run dev
            """,
            s["code"],
        ),
    ]

    story += [
        PageBreak(),
        p("4. Super Admin Activation", s["h1"]),
        table(
            [
                ["Step", "Super Admin action", "Expected result"],
                ["1", "Open Admin > Appointments. For organization clients, the same control also appears in Customer Review.", "The workspace list shows HotelRADAR and its WhatsApp readiness."],
                ["2", "Confirm the workspace badge says WhatsApp connected.", "Enable is available only when the stored Meta integration status is CONNECTED."],
                ["3", "Click Enable.", "The HotelRADAR AppointmentTenant is provisioned with AWAITING_GOOGLE status and a default service."],
                ["4", "Ask the HotelRADAR owner/admin to open Settings > Integrations.", "The Appointment Journey card is visible with a Connect Google action."],
                ["5", "Use Disable when the add-on is paused or cancelled.", "New appointment events are rejected immediately; Google credentials remain stored for a later re-enable."],
            ],
            [14 * mm, 72 * mm, 84 * mm],
        ),
        p("Activation rule: WhatsApp CONNECTED -> Super Admin enables Appointment Journey -> client connects Google -> live WhatsApp routing starts when status becomes GOOGLE_READY.", s["body"]),
        p("5. HotelRADAR Client Setup", s["h1"]),
        table(
            [
                ["Step", "Action", "Expected result"],
                ["1", "Open http://localhost:3000/settings/integrations.", "Settings > Integrations loads for the HotelRADAR workspace."],
                ["2", "Confirm the Appointment Journey card is visible.", "Tenant shows slug hotelradar, Awaiting Google, and services count at least 1."],
                ["3", "Click Connect Google.", "Browser redirects to Google consent."],
                ["4", "Sign in with the test-user Google account.", "Google shows consent for calendar app-created access, freebusy access, and drive.file."],
                ["5", "Approve consent.", "Callback returns to Settings > Integrations with appointment_google=connected."],
                ["6", "Inspect the card.", "Status is Google ready. Calendar and Sheet IDs are visible. Open links should work."],
                ["7", "Open Google Calendar.", "A secondary calendar named Appointment Journey - HotelRADAR exists."],
                ["8", "Open Google Sheet.", "Sheet contains Settings, Services, Bookings, and Feedback tabs."],
            ],
            [14 * mm, 68 * mm, 88 * mm],
        ),
        p("If the card shows action_required, the Google account connected but resource creation failed. Check that Calendar, Sheets, and Drive APIs are enabled, then reconnect Google.", s["body"]),
        PageBreak(),
        p("6. Data Storage Verification", s["h1"]),
        p("The HotelRADAR test creates or updates these records in Postgres:", s["body"]),
        table(
            [
                ["Model", "What to check"],
                ["AppointmentTenant", "aifrogiTenantId is hotelradar, status is GOOGLE_READY, encrypted token exists, calendarId and sheetId are filled."],
                ["AppointmentService", "Default service Appointment exists unless replaced by configured services."],
                ["AppointmentSession", "Created only after a WhatsApp/webhook test event."],
                ["AppointmentBooking", "Created after a slot selection event in the simulated booking flow."],
                ["AppointmentMessageLog", "Inbound events and outbound reservations are logged with idempotency keys."],
            ],
            [46 * mm, 122 * mm],
        ),
        code(
            """
DATABASE_URL="postgresql://USER@localhost:5432/lead_os_ai?schema=public" npx prisma studio
            """,
            s["code"],
        ),
    ]

    story += [
        p("7. Real-Time WhatsApp Test", s["h1"]),
        p("Use the phone number connected to HotelRADAR in Meta. Once the tenant is GOOGLE_READY, the Meta webhook routes messages to Appointment Journey and bypasses the general AI auto-reply.", s["body"]),
        table(
            [
                ["Step", "Customer sends", "Expected WhatsApp reply / result"],
                ["1", "Need an appointment", "Appointment Journey replies with the numbered service list."],
                ["2", "1", "The first service is selected and the bot asks for the customer name."],
                ["3", "Manish", "The bot replies with three numbered appointment slots."],
                ["4", "1", "The first slot is selected, a confirmed booking is stored, and a confirmation reply is sent."],
                ["5", "Send the first message again with a new customer number.", "A separate session starts because sessions are isolated by tenant and customer phone."],
            ],
            [14 * mm, 54 * mm, 102 * mm],
        ),
        p("Watch the Meta webhook response logs for appointmentEvents: 1. A value of 0 means the tenant is disabled, waiting for Google, or the provider phone number did not resolve to HotelRADAR.", s["body"]),
        PageBreak(),
        p("8. Signed Webhook Diagnostic", s["h1"]),
        p("After the HotelRADAR tenant reaches GOOGLE_READY, simulate AiFrogi forwarding a normalized WhatsApp event to Appointment Journey. This proves the product boundary without relying on live Meta traffic.", s["body"]),
        code(
            """
APPOINTMENT_JOURNEY_HMAC_SECRET="same-secret-as-env" node <<'NODE'
const crypto = require("crypto");

const body = JSON.stringify({
  tenant_id: "hotelradar",
  customer_phone: "919876543210",
  event_type: "text",
  payload: { text: "Need an appointment" },
  message_id: `wamid.hotelradar.${Date.now()}`,
  timestamp: Math.floor(Date.now() / 1000)
});

const signature = "sha256=" + crypto
  .createHmac("sha256", process.env.APPOINTMENT_JOURNEY_HMAC_SECRET)
  .update(body, "utf8")
  .digest("hex");

fetch("http://localhost:3000/api/appointment-journey/webhook/aifrogi", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-aifrogi-signature": signature
  },
  body
})
  .then(async (response) => {
    console.log(response.status);
    console.log(await response.text());
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
NODE
            """,
            s["code"],
        ),
        p("Expected response: HTTP 202 with a service-list reservation action. The first message moves the session from IDLE to SERVICE_SELECT.", s["body"]),
        p("For direct webhook diagnostics, send the service number as text, then the customer name, then the slot number. The live Meta path performs the same transitions and sends the customer-facing replies through the HotelRADAR WhatsApp connection.", s["body"]),
    ]

    story += [
        PageBreak(),
        p("9. Acceptance Checklist", s["h1"]),
        bullet("Super Admin can enable Appointment Journey only when HotelRADAR WhatsApp is connected.", s["bullet"]),
        bullet("HotelRADAR tenant appears in Settings > Integrations.", s["bullet"]),
        bullet("Google consent completes with the selected test-user account.", s["bullet"]),
        bullet("Appointment Journey card shows Google ready.", s["bullet"]),
        bullet("Calendar ID and Sheet ID are stored in Postgres.", s["bullet"]),
        bullet("Google Calendar opens and shows the Appointment Journey - HotelRADAR calendar.", s["bullet"]),
        bullet("Google Sheet opens and shows Settings, Services, Bookings, and Feedback tabs.", s["bullet"]),
        bullet("Signed webhook simulation returns 202 and creates AppointmentMessageLog rows.", s["bullet"]),
        bullet("A live Meta message reports appointmentEvents=1 and receives the numbered service reply.", s["bullet"]),
        bullet("The confirmed booking stores a Google Calendar event ID and appends a row to the Bookings tab.", s["bullet"]),
        bullet("npm run verify:appointment, npm run typecheck, npm run lint, and npm run build pass.", s["bullet"]),
        p("Known Current Limit", s["h1"]),
        p(
            "The live WhatsApp, Postgres, Google free/busy, Calendar event, cancellation, and Bookings-tab append paths are active. Payment webhooks, paid-hold promotion, rescheduling, reminders, review jobs, Feedback sync, and two-way Settings/Services sync remain production slices from the full playbook.",
            s["body"],
        ),
        p("Production Notes", s["h1"]),
        bullet("Keep the Google OAuth client secret only in server environment variables.", s["bullet"]),
        bullet("Because the secret appeared in a screenshot, rotate it before production if the screenshot may be shared.", s["bullet"]),
        bullet("For Google Auth test mode, only configured test users can connect.", s["bullet"]),
        bullet("The basic booking sandbox uses session messages inside the 24-hour customer-service window and does not require approved templates.", s["bullet"]),
        bullet("Before production reminders and reviews, approve Utility templates per WABA/language: appointment_confirmation, appointment_payment, appointment_reminder_24h, appointment_reminder_2h, and appointment_review_request.", s["bullet"]),
        bullet("Before public client onboarding, submit Google OAuth verification with the minimal scopes listed in this guide.", s["bullet"]),
    ]

    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUTPUT)
