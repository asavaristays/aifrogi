from pathlib import Path

from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "appointment-journey-glossy-workflow-guide.pdf"

PAGE_W, PAGE_H = landscape(A4)

DARK = HexColor("#201A28")
INK = HexColor("#2C243B")
MUTED = HexColor("#6D6477")
PINK = HexColor("#D92BCB")
PINK_2 = HexColor("#FF8AF1")
PINK_SOFT = HexColor("#FCEAFB")
GREEN = HexColor("#178665")
GREEN_SOFT = HexColor("#E8F7F1")
AMBER = HexColor("#A86312")
AMBER_SOFT = HexColor("#FFF4DF")
BLUE = HexColor("#2674D9")
BLUE_SOFT = HexColor("#EAF3FF")
SURFACE = HexColor("#FBF8FC")
LINE = HexColor("#E7E1EA")
CARD = HexColor("#FFFFFF")
SOFT_DARK = HexColor("#31263E")


def wrap(text, font, size, width):
    words = str(text).replace("\n", " ").split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_wrapped(c, text, x, y, width, font="Helvetica", size=9, leading=12, color=INK, max_lines=None):
    lines = wrap(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def round_rect(c, x, y, w, h, fill, stroke=None, radius=10, line_width=1):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(line_width)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1 if stroke else 0)


def pill(c, x, y, text, fill=PINK_SOFT, color=PINK, w=None):
    width = w or stringWidth(text, "Helvetica-Bold", 8) + 18
    round_rect(c, x, y, width, 18, fill, None, 9)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x + width / 2, y + 6, text)
    return width


def page_bg(c, page, title=None, section=None):
    c.setFillColor(SURFACE)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.rect(0, PAGE_H - 42, PAGE_W, 42, fill=1, stroke=0)
    c.setFillColor(PINK)
    c.rect(0, PAGE_H - 42, 190, 42, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(24, PAGE_H - 26, "AiFrogi Appointment Journey")
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#D9CFE1"))
    c.drawRightString(PAGE_W - 24, PAGE_H - 25, section or "Workflow guide")
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, 22, fill=1, stroke=0)
    c.setFillColor(HexColor("#D9CFE1"))
    c.setFont("Helvetica", 8)
    c.drawString(24, 8, "Sandbox-validated July 5, 2026 - production per client after Meta, Google and payment readiness")
    c.drawRightString(PAGE_W - 24, 8, f"Page {page}")
    if title:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(34, PAGE_H - 82, title)


def card(c, x, y, w, h, title, body="", accent=PINK, fill=CARD, title_size=11, body_size=8.6):
    round_rect(c, x, y, w, h, fill, LINE, 8)
    c.setFillColor(accent)
    c.roundRect(x, y + h - 8, w, 8, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", title_size)
    c.drawString(x + 14, y + h - 28, title)
    if body:
        draw_wrapped(c, body, x + 14, y + h - 45, w - 28, "Helvetica", body_size, body_size + 3, MUTED)


def dark_card(c, x, y, w, h, title, body="", accent=PINK_2):
    round_rect(c, x, y, w, h, SOFT_DARK, HexColor("#463754"), 10)
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 14, y + h - 25, title)
    if body:
        draw_wrapped(c, body, x + 14, y + h - 43, w - 28, "Helvetica", 8.5, 12, HexColor("#E7DDED"))


def arrow(c, x1, y1, x2, y2, color=MUTED, label=None):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.4)
    c.line(x1, y1, x2, y2)
    dx, dy = x2 - x1, y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    path = c.beginPath()
    path.moveTo(x2, y2)
    path.lineTo(x2 - 8 * ux + 4 * px, y2 - 8 * uy + 4 * py)
    path.lineTo(x2 - 8 * ux - 4 * px, y2 - 8 * uy - 4 * py)
    path.close()
    c.drawPath(path, stroke=0, fill=1)
    if label:
        c.setFillColor(color)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString((x1 + x2) / 2, (y1 + y2) / 2 + 7, label)


def flow_node(c, x, y, w, h, title, body="", fill=CARD, accent=PINK, dark=False):
    if dark:
        dark_card(c, x, y, w, h, title, body, accent=PINK_2)
        return
    round_rect(c, x, y, w, h, fill, accent, 8, 1.1)
    c.setFillColor(accent)
    c.circle(x + 16, y + h - 18, 5, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(x + 28, y + h - 22, title)
    if body:
        draw_wrapped(c, body, x + 14, y + h - 40, w - 28, "Helvetica", 7.7, 10.5, MUTED, max_lines=4)


def table(c, x, y, widths, headers, rows, row_h=28, header_h=24, title=None):
    if title:
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x, y + header_h + len(rows) * row_h + 11, title)
    total_w = sum(widths)
    c.setFillColor(DARK)
    c.rect(x, y + len(rows) * row_h, total_w, header_h, fill=1, stroke=0)
    cursor = x
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    for i, header in enumerate(headers):
        c.drawString(cursor + 7, y + len(rows) * row_h + 8, header)
        cursor += widths[i]
    for r, row in enumerate(rows):
        yy = y + (len(rows) - 1 - r) * row_h
        c.setFillColor(CARD if r % 2 == 0 else HexColor("#F8F5FA"))
        c.rect(x, yy, total_w, row_h, fill=1, stroke=0)
        c.setStrokeColor(LINE)
        c.line(x, yy, x + total_w, yy)
        cursor = x
        for i, cell in enumerate(row):
            color = INK if i == 0 else MUTED
            font = "Helvetica-Bold" if i == 0 else "Helvetica"
            draw_wrapped(c, cell, cursor + 7, yy + row_h - 12, widths[i] - 14, font, 7.4, 9.2, color, max_lines=2)
            cursor += widths[i]
    c.setStrokeColor(LINE)
    c.rect(x, y, total_w, header_h + len(rows) * row_h, fill=0, stroke=1)


def cover(c):
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(PINK)
    c.circle(PAGE_W - 45, PAGE_H + 15, 150, fill=1, stroke=0)
    c.setFillColor(HexColor("#3B2B49"))
    c.circle(PAGE_W - 140, 55, 145, fill=1, stroke=0)
    pill(c, 42, PAGE_H - 78, "SANDBOX-VALIDATED PRODUCT MODULE", PINK, white, 178)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 44)
    c.drawString(42, PAGE_H - 145, "Appointment")
    c.drawString(42, PAGE_H - 196, "Journey")
    c.setFont("Helvetica", 15)
    c.setFillColor(HexColor("#E9DDEA"))
    draw_wrapped(
        c,
        "A self-explanatory workflow guide for WhatsApp appointment automation, Meta template approval, Google Calendar, Google Sheets, dashboard controls and go-live operations.",
        45,
        PAGE_H - 235,
        430,
        "Helvetica",
        14,
        19,
        HexColor("#E9DDEA"),
    )
    dark_card(c, 535, PAGE_H - 170, 245, 68, "What is confirmed", "HotelRADAR sandbox booking passed: inbound WhatsApp event, booking state, Google Calendar event and Google Sheet row.", PINK_2)
    dark_card(c, 535, PAGE_H - 250, 245, 68, "Production condition", "Each client still needs WhatsApp API health, Meta template approval, Google OAuth and payment setup where required.", PINK_2)
    dark_card(c, 535, PAGE_H - 330, 245, 68, "Who should use this", "Founder, Super Admin, implementation team, sales demo team and client onboarding operators.", PINK_2)
    c.setFillColor(HexColor("#BFAFC7"))
    c.setFont("Helvetica", 9)
    c.drawString(45, 38, "Prepared for AiFrogi - July 5, 2026")
    c.drawRightString(PAGE_W - 45, 38, "Glossy workflow PDF")


def page_2(c):
    page_bg(c, 2, "Executive Confirmation", "Product status")
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(GREEN)
    c.drawString(36, PAGE_H - 116, "Yes - the Appointment Journey system is working and ready to announce.")
    draw_wrapped(
        c,
        "The implementation is not just a concept. It includes tenant provisioning, Super Admin enablement, Google OAuth, Calendar event creation, Google Sheet sync, WhatsApp signed event processing, appointment templates and homepage announcement.",
        36,
        PAGE_H - 142,
        520,
        "Helvetica",
        10.5,
        15,
        MUTED,
    )
    stats = [
        ("Live sandbox", "Passed with HotelRADAR"),
        ("Homepage", "Updated and deployed"),
        ("Meta templates", "Ready for submission"),
        ("Google sync", "Calendar + Sheet verified"),
    ]
    x = 36
    for title, value in stats:
        card(c, x, 245, 180, 90, title, value, GREEN if title != "Meta templates" else AMBER)
        x += 196
    table(
        c,
        36,
        72,
        [150, 165, 420],
        ["Layer", "Status", "What it means"],
        [
            ["Application dashboard", "Implemented", "Super Admin can enable Appointment Journey and Admin can connect Google from settings."],
            ["WhatsApp flow", "Sandbox-tested", "Inbound normalized events advance the appointment state machine in real time."],
            ["Google storage", "Working", "Calendar event and Google Sheet booking row are created after confirmation."],
            ["Meta templates", "Submission-ready", "Templates must be approved in each client WABA before proactive outbound sends."],
        ],
        row_h=30,
    )


def page_roles(c):
    page_bg(c, 3, "Who Does What", "System roles")
    flow_node(c, 45, 310, 180, 82, "Super Admin", "Enable product, confirm WhatsApp health, map Meta templates, monitor tenant readiness.", PINK_SOFT, PINK)
    flow_node(c, 330, 310, 180, 82, "Admin / Client Owner", "Connect Google, configure services, payment API, validity, booking and reschedule rules.", BLUE_SOFT, BLUE)
    flow_node(c, 615, 310, 180, 82, "Customer", "Starts a WhatsApp chat, selects service and slot, pays if required, receives notifications.", GREEN_SOFT, GREEN)
    arrow(c, 228, 350, 326, 350, PINK, "enable")
    arrow(c, 513, 350, 611, 350, GREEN, "book")
    table(
        c,
        48,
        75,
        [150, 210, 200, 190],
        ["Role", "Main screen", "Can configure", "Output"],
        [
            ["Super Admin", "/admin/appointments", "Product access, template pack, tenant status", "Client account is eligible for appointment automation"],
            ["Admin", "/settings/integrations", "Google OAuth, services, payment, working rules", "Calendar, Sheet and live workflow become ready"],
            ["System", "Backend services", "State machine, Calendar sync, Sheet sync, message logs", "Confirmed booking with auditable record"],
            ["Customer", "WhatsApp", "Service, name, slot, payment action", "Calendar invite/notification and booking confirmation"],
        ],
        row_h=32,
    )


def page_onboarding(c):
    page_bg(c, 4, "Client Onboarding Workflow", "Meta, templates and Google")
    nodes = [
        (36, "Create client", "Workspace and subscription context"),
        (175, "Connect WhatsApp", "WABA, number, webhook and health"),
        (314, "Submit templates", "Appointment Utility template pack"),
        (453, "Enable product", "Super Admin turns module on"),
        (592, "Connect Google", "Admin OAuth for Calendar + Sheet"),
        (731, "Go live", "Test booking and template send"),
    ]
    for i, (x, title, body) in enumerate(nodes):
        flow_node(c, x, 318, 100, 84, title, body, CARD, [PINK, BLUE, AMBER, PINK, GREEN, GREEN][i])
        if i < len(nodes) - 1:
            arrow(c, x + 102, 360, nodes[i + 1][0] - 4, 360)
    card(
        c,
        58,
        205,
        330,
        76,
        "Template approval rule",
        "Inbound replies inside the 24-hour customer-service window can run without templates. Proactive reminders, payment nudges, reschedule notices, cancellations and feedback requests need approved Meta templates.",
        AMBER,
    )
    card(
        c,
        450,
        205,
        330,
        76,
        "Single vs multiple use",
        "Once a template is approved in a WABA, it can be reused many times for that WABA with variables. If every client has its own WABA, submit the pack separately per client WABA.",
        BLUE,
    )
    table(
        c,
        58,
        62,
        [170, 180, 370],
        ["Readiness gate", "Owner", "Go-live requirement"],
        [
            ["WhatsApp API", "Super Admin + Client", "Phone number connected, webhook healthy and Meta payment method ready."],
            ["Templates", "Super Admin / WABA owner", "Required appointment templates approved or workflow limited to inbound 24-hour testing."],
            ["Google", "Client Admin", "OAuth completed; Calendar and Sheet resource IDs stored."],
            ["Payment", "Client Admin", "Razorpay/Stripe/etc. configured only when advance payment is enabled."],
        ],
        row_h=28,
    )


def page_whatsapp(c):
    page_bg(c, 5, "Real-Time WhatsApp Booking Workflow", "Customer journey")
    top = [
        (48, "Customer asks", "Need an appointment"),
        (188, "Webhook arrives", "Meta -> AiFrogi"),
        (328, "Tenant resolved", "hotelradar / client slug"),
        (468, "State machine", "service -> name -> slot"),
        (608, "Google check", "free/busy availability"),
    ]
    for i, (x, title, body) in enumerate(top):
        flow_node(c, x, 332, 112, 68, title, body, CARD, PINK if i == 0 else BLUE)
        if i < len(top) - 1:
            arrow(c, x + 115, 366, top[i + 1][0] - 4, 366)
    lower = [
        (608, "Hold / confirm", "Create booking record"),
        (468, "Calendar event", "Create event or delete on cancel"),
        (328, "Sheet row", "Append booking mirror"),
        (188, "WhatsApp reply", "Confirmation / next action"),
        (48, "Dashboard", "Admin can inspect status"),
    ]
    arrow(c, 664, 332, 664, 274)
    for i, (x, title, body) in enumerate(lower):
        flow_node(c, x, 205, 112, 68, title, body, GREEN_SOFT, GREEN)
        if i < len(lower) - 1:
            arrow(c, x, 239, lower[i + 1][0] + 116, 239)
    card(c, 80, 90, 215, 70, "If Google is not ready", "System should not confirm appointment. Tenant remains AWAITING_GOOGLE and Admin must connect Google first.", AMBER)
    card(c, 315, 90, 215, 70, "If payment is required", "System can hold the slot and send payment link. Booking confirms after payment webhook marks it paid.", BLUE)
    card(c, 550, 90, 215, 70, "If customer cancels", "Booking status changes to CANCELLED and the Google Calendar event is deleted or cancelled.", GREEN)


def page_data(c):
    page_bg(c, 6, "Where Data Is Stored", "Database, Sheet and Calendar")
    flow_node(c, 314, 315, 220, 92, "Postgres source of truth", "Tenant, services, sessions, bookings, payments, jobs, message logs and sync status.", PINK_SOFT, PINK)
    flow_node(c, 48, 320, 195, 78, "WhatsApp message logs", "Inbound event ID, customer phone, payload, action and audit trail.", BLUE_SOFT, BLUE)
    flow_node(c, 600, 320, 195, 78, "Application dashboard", "Admin views subscribed services, booking status and operational readiness.", BLUE_SOFT, BLUE)
    flow_node(c, 120, 160, 210, 82, "Google Calendar", "Customer-visible calendar event, reminder notifications and availability checking.", GREEN_SOFT, GREEN)
    flow_node(c, 510, 160, 210, 82, "Google Sheet", "Operational mirror for bookings, services, settings and feedback.", GREEN_SOFT, GREEN)
    arrow(c, 245, 360, 310, 360, BLUE)
    arrow(c, 538, 360, 596, 360, BLUE)
    arrow(c, 390, 315, 225, 246, GREEN, "event")
    arrow(c, 460, 315, 614, 246, GREEN, "row")
    table(
        c,
        60,
        57,
        [160, 190, 390],
        ["Storage", "User access", "Purpose"],
        [
            ["App database", "System and dashboard", "Authoritative state, audit, idempotency, payments and retries."],
            ["Google Calendar", "Client Google account", "Calendar notifications and operational schedule visibility."],
            ["Google Sheet", "Client Google account", "Simple tabular operations view for staff and owner reporting."],
            ["WhatsApp", "Customer phone", "Conversation interface for booking, cancellation, reschedule and reminders."],
        ],
        row_h=29,
    )


def page_google(c):
    page_bg(c, 7, "Google Sheet And Calendar Model", "Operational sync")
    table(
        c,
        42,
        250,
        [120, 145, 155, 390],
        ["Google area", "Direction", "Status", "What it stores"],
        [
            ["Calendar", "Read/write", "Implemented", "Free/busy slots, appointment event creation and cancellation."],
            ["Bookings tab", "Postgres -> Sheet", "Implemented", "Booking ID, customer, phone, service, slot, status, payment, Calendar event ID."],
            ["Settings tab", "Sheet -> Postgres", "Recommended next", "Working hours, review link, payment rule and timezone."],
            ["Services tab", "Sheet -> Postgres", "Recommended next", "Service name, duration, price and active status."],
            ["Feedback tab", "Postgres -> Sheet", "Recommended next", "Rating, feedback comment and review routing status."],
        ],
        row_h=31,
    )
    card(c, 54, 120, 230, 82, "Calendar access", "The client can see appointments in their Google Calendar and receive calendar notifications based on their Google settings.", GREEN)
    card(c, 306, 120, 230, 82, "Sheet access", "The client can open the Google Sheet for tabular booking visibility without entering the app dashboard.", BLUE)
    card(c, 558, 120, 230, 82, "Dashboard access", "The app remains the safest control center for status, subscription, reschedule, payment and workflow actions.", PINK)


def page_templates(c):
    page_bg(c, 8, "Recommended Meta Template Pack", "Approval checklist")
    templates = [
        ["appointment_confirmation_v1", "Utility", "Booking confirmed", "Reschedule, Cancel"],
        ["appointment_payment_request_v1", "Utility", "Payment required", "Pay now"],
        ["appointment_payment_received_v1", "Utility", "Payment received", "None"],
        ["appointment_reminder_24h_v1", "Utility", "One day reminder", "Reschedule, Cancel"],
        ["appointment_reminder_2h_v1", "Utility", "Two hour reminder", "Reschedule"],
        ["appointment_rescheduled_v1", "Utility", "New slot confirmed", "Cancel"],
        ["appointment_cancelled_v1", "Utility", "Booking cancelled", "None"],
        ["appointment_feedback_request_v1", "Utility candidate", "Post-appointment feedback", "Share feedback"],
    ]
    table(c, 40, 120, [220, 110, 225, 180], ["Template", "Category", "When used", "Buttons"], templates, row_h=29)
    card(
        c,
        52,
        62,
        340,
        52,
        "Super Admin idea",
        "Enable the appointment template pack from Super Admin, then submit/map the approved template names for that client's WABA.",
        PINK,
        title_size=10,
    )
    card(
        c,
        432,
        62,
        340,
        52,
        "Compliance rule",
        "Do not add discounts, offers or sales copy to Utility appointment templates. Keep them tied to a real booking.",
        AMBER,
        title_size=10,
    )


def page_dashboard(c):
    page_bg(c, 9, "Admin Dashboard And Product Controls", "Operations view")
    dark_card(c, 42, 275, 240, 118, "Super Admin view", "Enable/disable Appointment Journey, see WhatsApp connected state, see Google readiness, review template pack and monitor clients.")
    dark_card(c, 302, 275, 240, 118, "Admin settings", "Connect Google OAuth, inspect Calendar and Sheet IDs, configure services, payment and booking behavior.")
    dark_card(c, 562, 275, 240, 118, "Subscribed services", "Services subscribed by the client appear in the dashboard so Admin sees what products are active.")
    table(
        c,
        48,
        78,
        [170, 220, 350],
        ["Control", "Who owns it", "Expected dashboard behavior"],
        [
            ["Validity", "Super Admin / Billing", "Automation pauses when subscription or add-on validity expires."],
            ["Booking status", "System + Admin", "CONFIRMED, CANCELLED, COMPLETED, NO_SHOW and payment status visible."],
            ["Reschedule", "Admin / Customer", "Future tab/action should move Calendar event and update Sheet row."],
            ["Payment API", "Admin", "When enabled, booking waits for payment before final confirmation."],
            ["Templates", "Super Admin", "Production scheduled sends blocked until approved template is mapped."],
        ],
        row_h=30,
    )


def page_testing(c):
    page_bg(c, 10, "Sandbox Test And Production Go-Live", "Checklist")
    table(
        c,
        42,
        228,
        [72, 245, 170, 260],
        ["Phase", "Test", "Pass signal", "Notes"],
        [
            ["1", "Enable Appointment Journey for client", "Tenant active", "Requires WhatsApp CONNECTED first."],
            ["2", "Connect Google OAuth", "GOOGLE_READY", "Calendar and Sheet IDs stored."],
            ["3", "Send inbound WhatsApp sandbox event", "Service list reply", "Can run without template inside 24-hour window."],
            ["4", "Choose service/name/slot", "Booking confirmed", "Calendar event created and Sheet row appended."],
            ["5", "Run template send test", "Meta accepted", "Required before reminders/payments outside 24-hour window."],
            ["6", "Production monitor", "Ready endpoint OK", "Check app, webhook, DB and template errors."],
        ],
        row_h=31,
    )
    card(c, 58, 115, 230, 70, "Sandbox is enough when", "You only need to validate inbound real-time booking and Google sync before public announcement.", GREEN)
    card(c, 306, 115, 230, 70, "Production needs more when", "A client expects proactive reminders, payment nudges, cancellation notices or feedback messages.", AMBER)
    card(c, 554, 115, 230, 70, "Current live claim", "Homepage says sandbox-validated, not universally production-live for every client.", PINK)


def page_faq(c):
    page_bg(c, 11, "Decision FAQ", "Plain answers")
    faqs = [
        ("Is our understanding correct?", "Yes. Super Admin enables the product. Admin configures Google, services, payment, validity and workflow. Data syncs to Calendar and Sheet while the app database remains source of truth."),
        ("Do templates need to be approved once or every time?", "A template is approved once per WABA and language, then reused many times with variables. If every client owns a separate WABA, submit/approve the pack in each WABA."),
        ("Where does the customer get notified?", "Through WhatsApp messages and through Google Calendar notifications when the event exists in the connected Google Calendar."),
        ("Can we announce on the homepage?", "Yes. The homepage has been updated with a sandbox-validated Appointment Journey section and an animated prototype."),
        ("What remains for full production?", "Per-client Meta template approval, payment gateway setup, final reschedule/payment jobs and client-specific service rules."),
    ]
    y = PAGE_H - 118
    for i, (q, a) in enumerate(faqs, 1):
        card(c, 52, y - 54, 740, 54, f"{i}. {q}", a, [PINK, BLUE, GREEN, PINK, AMBER][i - 1], title_size=10, body_size=7.8)
        y -= 66
    c.setFillColor(PINK)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(PAGE_W / 2, 48, "Appointment Journey: ready to demo, ready to onboard, production-ready per client after approvals.")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A4))
    c.setTitle("Appointment Journey Glossy Workflow Guide")
    c.setAuthor("AiFrogi")
    c.setSubject("WhatsApp appointment automation workflow, Meta templates, Google Calendar and Google Sheets")
    pages = [cover, page_2, page_roles, page_onboarding, page_whatsapp, page_data, page_google, page_templates, page_dashboard, page_testing, page_faq]
    for i, fn in enumerate(pages):
        fn(c)
        if i < len(pages) - 1:
            c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
