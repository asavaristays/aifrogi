from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "appointment-journey-system-flowchart.pdf"

PAGE_W, PAGE_H = landscape(A4)
NAVY = HexColor("#20243A")
PURPLE = HexColor("#5B4FCB")
GREEN = HexColor("#DDF6E8")
GREEN_BORDER = HexColor("#2B8A5A")
AMBER = HexColor("#FFF0CC")
AMBER_BORDER = HexColor("#C58412")
BLUE = HexColor("#E9EEFF")
BLUE_BORDER = HexColor("#5267C9")
GRAY = HexColor("#F5F6F8")
GRAY_BORDER = HexColor("#A8ADB8")
MUTED = HexColor("#5D6473")
LINE = HexColor("#596173")


def wrap_lines(text, font, size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def page_frame(c, title, subtitle, page_number):
    c.setFillColor(PURPLE)
    c.rect(0, PAGE_H - 50, PAGE_W, 50, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(34, PAGE_H - 31, title)
    c.setFillColor(NAVY)
    c.setFont("Helvetica", 10)
    c.drawString(36, PAGE_H - 69, subtitle)
    c.setFillColor(PURPLE)
    c.rect(0, 0, PAGE_W, 25, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica", 9)
    c.drawRightString(PAGE_W - 32, 9, f"Appointment Journey | Page {page_number}")


def box(c, x, y, w, h, text, fill=BLUE, border=BLUE_BORDER, size=10, subtitle=None):
    c.setFillColor(fill)
    c.setStrokeColor(border)
    c.setLineWidth(1.2)
    c.roundRect(x, y, w, h, 5, stroke=1, fill=1)
    lines = wrap_lines(text, "Helvetica-Bold", size, w - 16)
    sub_lines = wrap_lines(subtitle, "Helvetica", 8, w - 16) if subtitle else []
    total = len(lines) * (size + 2) + len(sub_lines) * 10
    cursor = y + (h + total) / 2 - size
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", size)
    for line in lines:
        c.drawCentredString(x + w / 2, cursor, line)
        cursor -= size + 2
    if sub_lines:
        cursor -= 2
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        for line in sub_lines:
            c.drawCentredString(x + w / 2, cursor, line)
            cursor -= 10


def arrow(c, x1, y1, x2, y2, label=None):
    c.setStrokeColor(LINE)
    c.setFillColor(LINE)
    c.setLineWidth(1.3)
    c.line(x1, y1, x2, y2)
    dx = x2 - x1
    dy = y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    tip = (x2, y2)
    left = (x2 - 8 * ux + 4 * px, y2 - 8 * uy + 4 * py)
    right = (x2 - 8 * ux - 4 * px, y2 - 8 * uy - 4 * py)
    path = c.beginPath()
    path.moveTo(*tip)
    path.lineTo(*left)
    path.lineTo(*right)
    path.close()
    c.drawPath(path, stroke=0, fill=1)
    if label:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(MUTED)
        c.drawCentredString((x1 + x2) / 2, (y1 + y2) / 2 + 5, label)


def legend(c):
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(GREEN)
    c.setStrokeColor(GREEN_BORDER)
    c.rect(PAGE_W - 230, PAGE_H - 78, 13, 9, fill=1, stroke=1)
    c.setFillColor(MUTED)
    c.drawString(PAGE_W - 211, PAGE_H - 77, "Implemented now")
    c.setFillColor(AMBER)
    c.setStrokeColor(AMBER_BORDER)
    c.rect(PAGE_W - 130, PAGE_H - 78, 13, 9, fill=1, stroke=1)
    c.setFillColor(MUTED)
    c.drawString(PAGE_W - 111, PAGE_H - 77, "Production next")


def activation_page(c):
    page_frame(c, "1. Product Activation And Setup", "Who enables the product and when live routing begins", 1)
    legend(c)
    y = 360
    items = [
        (35, "Super Admin", "Admin > Appointments"),
        (180, "WhatsApp connected?", "Meta integration must be CONNECTED"),
        (335, "Enable Appointment Journey", "Create tenant and default service"),
        (505, "Client Admin / Owner", "Authorize the client's Google account"),
        (660, "GOOGLE_READY", "Calendar and Sheet IDs stored"),
    ]
    widths = [110, 125, 140, 125, 130]
    for index, (x, title, sub) in enumerate(items):
        box(c, x, y, widths[index], 72, title, GREEN, GREEN_BORDER, 10, sub)
        if index < len(items) - 1:
            arrow(c, x + widths[index], y + 36, items[index + 1][0] - 5, y + 36)

    box(c, 180, 225, 125, 62, "Not connected", GRAY, GRAY_BORDER, 10, "Complete Meta setup and validation")
    arrow(c, 242, y, 242, 292, "No")
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(310, y + 45, "Yes")

    box(c, 335, 120, 140, 64, "Disable product", GREEN, GREEN_BORDER, 10, "Stops new routing; retains data and credentials")
    arrow(c, 405, y, 405, 190, "Pause / cancel")

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(35, 78, "Activation rule")
    c.setFont("Helvetica", 10)
    c.setFillColor(MUTED)
    c.drawString(35, 60, "WhatsApp CONNECTED -> Super Admin enables -> Google connected -> status GOOGLE_READY -> live appointment routing starts.")


def booking_page(c):
    page_frame(c, "2. Real-Time WhatsApp Booking", "How one customer message becomes a confirmed Postgres booking", 2)
    legend(c)
    top_y = 380
    top = [
        (35, 115, "Customer message"),
        (185, 115, "Meta webhook"),
        (335, 130, "Verify + resolve workspace"),
        (500, 130, "Appointment router"),
        (665, 130, "Load session"),
    ]
    for i, (x, w, title) in enumerate(top):
        box(c, x, top_y, w, 58, title, GREEN, GREEN_BORDER)
        if i < len(top) - 1:
            arrow(c, x + w, top_y + 29, top[i + 1][0] - 5, top_y + 29)

    steps = [
        (665, 270, "1. Service", "Customer replies with option number"),
        (500, 270, "2. Name", "Collect customer name"),
        (335, 270, "3. Slot", "Customer replies with slot number"),
        (170, 270, "4. Booking", "Create hold / confirmed record"),
        (35, 270, "Postgres", "Source of truth"),
    ]
    arrow(c, 730, top_y, 730, 334)
    for i, (x, y, title, sub) in enumerate(steps):
        box(c, x, y, 130 if x != 35 else 105, 62, title, GREEN, GREEN_BORDER, 10, sub)
        if i < len(steps) - 1:
            arrow(c, x, y + 31, steps[i + 1][0] + (130 if steps[i + 1][0] != 35 else 105) + 5, y + 31)

    outputs = [
        (115, "WhatsApp confirmation", GREEN, GREEN_BORDER),
        (320, "Google Calendar event", GREEN, GREEN_BORDER),
        (525, "Google Sheet row", GREEN, GREEN_BORDER),
    ]
    for x, title, fill, border in outputs:
        box(c, x, 120, 165, 62, title, fill, border, 10)
        arrow(c, 87, 270, x + 82, 188)

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(35, 77, "If the tenant is disabled or not GOOGLE_READY, the message continues through the normal AiFrogi bot or live inbox path.")


def sync_page(c):
    page_frame(c, "3. Calendar And Google Sheet Data Flow", "Postgres remains authoritative; Google is an operational mirror", 3)
    legend(c)

    box(c, 325, 335, 190, 85, "Postgres", GREEN, GREEN_BORDER, 15, "Tenants, services, sessions, bookings, payments and jobs")

    box(c, 40, 340, 200, 72, "WhatsApp events", GREEN, GREEN_BORDER, 12, "Inbound messages and outbound delivery logs")
    arrow(c, 240, 376, 320, 376)

    box(c, 600, 360, 190, 72, "Google Calendar", GREEN, GREEN_BORDER, 12, "Free/busy, create and cancel; reschedule next")
    arrow(c, 520, 392, 595, 402, "write")
    arrow(c, 595, 378, 520, 363, "event ID")

    box(c, 600, 220, 190, 90, "Google Sheet", GREEN, GREEN_BORDER, 12, "Headers and Bookings append live; other tabs next")
    arrow(c, 520, 350, 595, 280, "queued sync")
    arrow(c, 595, 250, 520, 330, "validated pull")

    box(c, 40, 205, 200, 90, "Scheduled jobs", AMBER, AMBER_BORDER, 12, "Hold expiry, 24h reminder, 2h reminder, review request")
    arrow(c, 320, 345, 245, 270, "create")
    arrow(c, 245, 235, 320, 325, "status")

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(40, 150, "Google Sheet directions")
    rows = [
        ("Settings", "Sheet -> Postgres", "Working hours, payment setting, review link"),
        ("Services", "Sheet -> Postgres", "Name, duration, price and active status"),
        ("Bookings", "Postgres -> Sheet", "Customer, service, slot, booking and payment status"),
        ("Feedback", "Postgres -> Sheet", "Rating, comment and review routing"),
    ]
    y = 126
    for tab, direction, data in rows:
        c.setFillColor(GRAY)
        c.setStrokeColor(GRAY_BORDER)
        c.rect(40, y - 14, 750, 23, fill=1, stroke=1)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(50, y - 7, tab)
        c.setFont("Helvetica", 9)
        c.drawString(145, y - 7, direction)
        c.setFillColor(MUTED)
        c.drawString(285, y - 7, data)
        y -= 25


def status_page(c):
    page_frame(c, "4. Roles, Controls And Delivery Status", "Operational ownership and the current production boundary", 4)
    legend(c)

    roles = [
        (35, "Super Admin", "Verify WhatsApp, enable/disable product, connect legacy Google accounts, monitor status."),
        (300, "Client Admin / Owner", "Authorize Google, manage services and working hours, inspect Calendar and Sheet."),
        (565, "Customer", "Start booking, select service and slot, pay, cancel, reschedule and leave feedback."),
    ]
    for x, title, sub in roles:
        box(c, x, 380, 235, 80, title, BLUE, BLUE_BORDER, 12, sub)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(35, 330, "Implemented now")
    implemented = [
        "Super Admin workspace enable and disable control",
        "WhatsApp readiness enforcement and live Meta routing",
        "Google OAuth, Calendar creation and four-tab Sheet creation",
        "Encrypted Google refresh-token storage",
        "WhatsApp service, name and numeric slot conversation",
        "Postgres booking and message-log persistence",
        "Calendar free/busy, event creation and cancellation deletion",
        "Sheet header initialization and Bookings ledger append",
    ]
    y = 304
    for item in implemented:
        c.setFillColor(GREEN_BORDER)
        c.circle(42, y + 3, 3, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 10)
        c.drawString(53, y, item)
        y -= 24

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(435, 330, "Production integrations remaining")
    pending = [
        "Calendar reschedule updates and paid-hold promotion",
        "Feedback tab synchronization",
        "Settings and Services tab validated pull",
        "Razorpay payment links and signed webhooks",
        "Reminder, review and retry jobs",
    ]
    y = 304
    for item in pending:
        c.setFillColor(AMBER_BORDER)
        c.circle(442, y + 3, 3, fill=1, stroke=0)
        lines = wrap_lines(item, "Helvetica", 10, 340)
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 10)
        for line in lines:
            c.drawString(453, y, line)
            y -= 12
        y -= 12

    c.setFillColor(GRAY)
    c.setStrokeColor(GRAY_BORDER)
    c.roundRect(35, 62, 755, 54, 5, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, 94, "Core rule")
    c.setFont("Helvetica", 9.5)
    c.setFillColor(MUTED)
    c.drawString(50, 77, "Postgres is always the source of truth. Calendar and Sheet operations are idempotent mirrors and must never block a WhatsApp reply.")


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A4))
    c.setTitle("Appointment Journey System Flowchart")
    c.setAuthor("AiFrogi")
    for draw_page in (activation_page, booking_page, sync_page, status_page):
        draw_page(c)
        c.showPage()
    c.save()


if __name__ == "__main__":
    build()
    print(OUTPUT)
