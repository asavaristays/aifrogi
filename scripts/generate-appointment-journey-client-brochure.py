from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "pingbook-client-ebrochure.pdf"
LOGO = ROOT / "public" / "brand" / "pingbook-logo-aifrogi-tight.png"

PAGE_W, PAGE_H = landscape(A4)

FONT_REGULAR = "Arial"
FONT_BOLD = "Arial-Bold"
FONT_PATH = Path("/System/Library/Fonts/Supplemental/Arial.ttf")
BOLD_FONT_PATH = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")

if FONT_PATH.exists() and BOLD_FONT_PATH.exists():
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(FONT_PATH)))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, str(BOLD_FONT_PATH)))
else:
    FONT_REGULAR = "Helvetica"
    FONT_BOLD = "Helvetica-Bold"

DARK = HexColor("#201A28")
PANEL = HexColor("#30263D")
INK = HexColor("#2C243B")
MUTED = HexColor("#5F5668")
SOFT = HexColor("#FBF8FC")
LINE = HexColor("#E8E0EA")
PINK = HexColor("#D92BCB")
PINK_2 = HexColor("#FF8AF1")
GREEN = HexColor("#5A2456")
BLUE = HexColor("#2674D9")
AMBER = HexColor("#A86312")
CARD = HexColor("#FFFFFF")


def wrap(value, font, size, width):
    words = str(value).split()
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


def draw_text(c, value, x, y, width, font=FONT_REGULAR, size=12, leading=17, color=INK, max_lines=None):
    c.setFillColor(color)
    c.setFont(font, size)
    lines = []
    for paragraph in str(value).split("\n"):
        lines.extend(wrap(paragraph, font, size, width) or [""])
    if max_lines:
        lines = lines[:max_lines]
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def rounded(c, x, y, w, h, fill, stroke=None, r=14, lw=1):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(lw)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke else 0)


def brand_header(c, page, label):
    c.setFillColor(SOFT)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.rect(0, PAGE_H - 40, PAGE_W, 40, fill=1, stroke=0)
    c.setFillColor(PINK)
    c.rect(0, PAGE_H - 40, 202, 40, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 13)
    c.drawString(24, PAGE_H - 25, "AiFrogi PingBook")
    c.setFont(FONT_REGULAR, 10)
    c.setFillColor(HexColor("#E6DCEA"))
    c.drawRightString(PAGE_W - 26, PAGE_H - 25, label)
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, 22, fill=1, stroke=0)
    c.setFillColor(HexColor("#D8CFDF"))
    c.setFont(FONT_REGULAR, 9)
    c.drawString(26, 8, "AiFrogi PingBook")
    c.drawRightString(PAGE_W - 26, 8, f"Page {page}")


def title(c, text, y=442, size=30, width=720, color=INK):
    return draw_text(c, text, 42, y, width, FONT_BOLD, size, size + 6, color)


def body(c, text, x, y, width, color=MUTED):
    return draw_text(c, text, x, y, width, FONT_REGULAR, 15, 21, color)


def pill(c, x, y, text, fill=PINK, color=white):
    w = stringWidth(text, FONT_BOLD, 10) + 24
    rounded(c, x, y, w, 22, fill, None, 11)
    c.setFillColor(color)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(x + w / 2, y + 6.5, text)
    return w


def card(c, x, y, w, h, heading, copy, accent=PINK):
    rounded(c, x, y, w, h, CARD, LINE, 12)
    c.setFillColor(accent)
    c.roundRect(x, y + h - 9, w, 9, 9, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont(FONT_BOLD, 16)
    c.drawString(x + 18, y + h - 34, heading)
    draw_text(c, copy, x + 18, y + h - 60, w - 36, FONT_REGULAR, 12.2, 17, MUTED)


def dark_card(c, x, y, w, h, heading, copy):
    rounded(c, x, y, w, h, PANEL, HexColor("#594768"), 14)
    c.setFillColor(PINK_2)
    c.setFont(FONT_BOLD, 14)
    c.drawString(x + 18, y + h - 31, heading)
    draw_text(c, copy, x + 18, y + h - 58, w - 36, FONT_REGULAR, 12.2, 17, HexColor("#EFE5F2"))


def icon_dot(c, x, y, color, number=None):
    c.setFillColor(color)
    c.circle(x, y, 16, fill=1, stroke=0)
    if number:
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 11)
        c.drawCentredString(x, y - 4, str(number))


def arrow(c, x1, y1, x2, y2, color=PINK):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(2)
    c.line(x1, y1, x2, y2)
    dx, dy = x2 - x1, y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    p = c.beginPath()
    p.moveTo(x2, y2)
    p.lineTo(x2 - 10 * ux + 5 * px, y2 - 10 * uy + 5 * py)
    p.lineTo(x2 - 10 * ux - 5 * px, y2 - 10 * uy - 5 * py)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


def cover(c):
    c.setFillColor(DARK)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(PINK)
    c.circle(PAGE_W - 40, PAGE_H + 10, 150, fill=1, stroke=0)
    c.setFillColor(HexColor("#3A2A49"))
    c.circle(PAGE_W - 120, 70, 148, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 14)
    c.drawString(50, PAGE_H - 64, "AiFrogi's PingBook")
    pill(c, 50, PAGE_H - 124, "CLIENT E-BROCHURE")
    draw_text(c, "Book appointments\nfrom WhatsApp.", 50, PAGE_H - 190, 470, FONT_BOLD, 39, 48, white)
    draw_text(
        c,
        "A screen-friendly brochure for service businesses that want confirmed appointments, payment discipline, Google visibility and fewer missed replies.",
        53,
        PAGE_H - 300,
        470,
        FONT_REGULAR,
        16,
        23,
        HexColor("#EFE5F2"),
    )
    rounded(c, 545, PAGE_H - 224, 240, 160, white, HexColor("#FFFFFF"), 14)
    if LOGO.exists():
        c.drawImage(str(LOGO), 563, PAGE_H - 210, width=204, height=130, preserveAspectRatio=True, mask="auto")
    dark_card(c, 545, PAGE_H - 340, 240, 96, "Client outcome", "A customer books through WhatsApp; the owner sees Calendar and Sheet updates.")
    dark_card(c, 545, PAGE_H - 454, 240, 96, "Trusted workflow", "WhatsApp conversation, Google Calendar/Sheets and Razorpay payment flow.")


def audience_1(c):
    brand_header(c, 2, "Target clients")
    title(c, "Built for businesses where every missed reply can become a missed booking.", size=27, width=740)
    body(c, "PingBook is for service businesses that already receive enquiries on WhatsApp but still manage bookings manually across calls, diaries, spreadsheets and payment screenshots.", 45, 348, 680)
    card(c, 54, 198, 220, 112, "Clinics & wellness", "Consultations, follow-ups, reminders and no-show reduction.", PINK)
    card(c, 310, 198, 220, 112, "Salons & spas", "Service selection, slot reminders and advance payment support.", GREEN)
    card(c, 566, 198, 220, 112, "Consultants", "Discovery calls, paid sessions and Google Calendar visibility.", BLUE)
    body(c, "Simple promise: customer messages on WhatsApp, the system collects intent, service, name and slot, then saves the booking into Google Calendar and Google Sheets.", 74, 116, 700, PINK)


def audience_2(c):
    brand_header(c, 3, "More target clients")
    title(c, "Also useful for appointment-led local businesses.", size=29)
    card(c, 54, 278, 220, 118, "Coaches & trainers", "Class slots, paid sessions, renewal nudges and structured follow-up.", AMBER)
    card(c, 310, 278, 220, 118, "Local services", "Repair visits, site inspections, demos, consultations and appointment routing.", PINK)
    card(c, 566, 278, 220, 118, "Hospitality services", "Experience bookings, calls, visits and service appointments.", GREEN)
    dark_card(c, 78, 122, 320, 88, "The best client profile", "The business already gets WhatsApp enquiries and loses time converting those chats into confirmed appointments.")
    dark_card(c, 445, 122, 320, 88, "The strongest offer", "A practical booking operations layer - not just a chatbot and not only a campaign tool.")


def problem(c):
    brand_header(c, 4, "Problem and solution")
    title(c, "What changes for your client?", size=31)
    card(c, 55, 290, 225, 118, "Before", "Late replies, manual slot checks, payment screenshots and booking notes scattered across chats.", AMBER)
    card(c, 310, 290, 225, 118, "With automation", "WhatsApp collects service, customer name, preferred slot and next action.", BLUE)
    card(c, 565, 290, 225, 118, "After", "Confirmed booking, Calendar event, Sheet record and payment-aware workflow.", GREEN)
    rows = [
        ("Manual follow-up", "Structured WhatsApp flow"),
        ("Slot confusion", "Calendar availability check"),
        ("Forgotten reminders", "Approved template reminders"),
        ("Scattered records", "Google Calendar + Sheet visibility"),
    ]
    y = 204
    for before, after in rows:
        rounded(c, 86, y, 300, 42, CARD, LINE, 8)
        rounded(c, 452, y, 300, 42, CARD, LINE, 8)
        draw_text(c, before, 104, y + 15, 260, FONT_BOLD, 12, 14, MUTED)
        draw_text(c, after, 470, y + 15, 260, FONT_BOLD, 12, 14, INK)
        arrow(c, 400, y + 21, 438, y + 21)
        y -= 54


def workflow(c):
    brand_header(c, 5, "How it works")
    title(c, "One booking journey, five clean steps.", size=31)
    steps = [
        ("Customer chats", "Need an appointment"),
        ("Bot qualifies", "Service, name and slot"),
        ("Availability check", "Google Calendar free/busy"),
        ("Payment if needed", "Razorpay link and status"),
        ("Booking synced", "Calendar event + Sheet row"),
    ]
    x = 54
    colors = [PINK, BLUE, GREEN, AMBER, PINK]
    for i, (h, copy) in enumerate(steps):
        rounded(c, x, 285, 132, 112, CARD, colors[i], 12, 1.2)
        icon_dot(c, x + 28, 362, colors[i], i + 1)
        draw_text(c, h, x + 18, 337, 100, FONT_BOLD, 12, 15, INK, 2)
        draw_text(c, copy, x + 18, 306, 100, FONT_REGULAR, 10, 13, MUTED, 2)
        if i < len(steps) - 1:
            arrow(c, x + 136, 340, x + 156, 340)
        x += 154
    card(c, 72, 132, 210, 88, "Customer", "No app download. They book from familiar WhatsApp replies.", GREEN)
    card(c, 316, 132, 210, 88, "Staff", "Bookings become visible in Calendar and Sheet.", BLUE)
    card(c, 560, 132, 210, 88, "Owner", "Dashboard shows product status and readiness.", PINK)


def trusted(c):
    brand_header(c, 6, "Trusted workflow")
    title(c, "Works with tools clients already trust.", size=31)
    platforms = [
        ("WhatsApp", "Customer conversation", GREEN),
        ("Google Calendar", "Appointment events", BLUE),
        ("Google Sheets", "Booking records", GREEN),
        ("Razorpay", "Payment links", BLUE),
    ]
    x = 64
    for i, (name, sub, color) in enumerate(platforms):
        rounded(c, x, 300, 160, 88, CARD, LINE, 12)
        icon_dot(c, x + 34, 344, color)
        next_y = draw_text(c, name, x + 65, 356, 82, FONT_BOLD, 11.2, 12.5, INK, 2)
        draw_text(c, sub, x + 65, next_y - 2, 82, FONT_REGULAR, 9.4, 11.5, MUTED, 2)
        if i < len(platforms) - 1:
            arrow(c, x + 164, 344, x + 184, 344)
        x += 190
    card(c, 82, 168, 300, 108, "Client value", "The client does not need a new operational habit. Their appointment data appears in WhatsApp, Google Calendar and Google Sheets.", GREEN)
    card(c, 456, 168, 300, 108, "Payment value", "If advance payment is required, the flow can send a Razorpay payment link before final confirmation.", BLUE)
    card(
        c,
        82,
        48,
        674,
        86,
        "Logo disclaimer",
        "Reference names are used only to identify compatible third-party services. WhatsApp, Google and Razorpay trademarks belong to their respective owners. No endorsement or partnership is implied.",
        AMBER,
    )


def features_1(c):
    brand_header(c, 7, "Features")
    title(c, "Core features clients understand quickly.", size=31)
    card(c, 64, 285, 330, 104, "WhatsApp booking assistant", "Guided conversation for appointment intent, service, customer name and slot selection.", PINK)
    card(c, 444, 285, 330, 104, "Service catalogue", "Services, durations, prices and availability rules can be configured per client.", BLUE)
    card(c, 64, 145, 330, 104, "Calendar availability", "Google Calendar free/busy checks reduce accidental double booking.", GREEN)
    card(c, 444, 145, 330, 104, "Google Sheet mirror", "Confirmed bookings can be saved into a simple spreadsheet view for staff.", AMBER)


def features_2(c):
    brand_header(c, 8, "More features")
    title(c, "Controls for payment, reminders and admin visibility.", size=30)
    card(c, 64, 285, 330, 104, "Payment-ready path", "Razorpay links can support advance payment before final appointment confirmation.", BLUE)
    card(c, 444, 285, 330, 104, "Reminder-ready templates", "Meta-approved templates can power confirmations, reminders, cancellations and feedback requests.", GREEN)
    card(c, 64, 145, 330, 104, "Super Admin control", "AiFrogi can enable product access and monitor readiness per client.", PINK)
    card(c, 444, 145, 330, 104, "Dashboard visibility", "Admin can view subscribed services, status, validity and booking controls.", AMBER)


def outcomes(c):
    brand_header(c, 9, "Business outcomes")
    title(c, "Why clients will care.", size=31)
    card(c, 55, 292, 225, 100, "Faster response", "Customers get guided next steps instantly instead of waiting for manual replies.", GREEN)
    card(c, 310, 292, 225, 100, "Fewer missed bookings", "The system keeps the customer inside a structured booking flow.", PINK)
    card(c, 565, 292, 225, 100, "Lower no-shows", "Approved WhatsApp reminders and Calendar visibility reduce forgotten appointments.", BLUE)
    card(c, 55, 160, 225, 100, "Cleaner operations", "Bookings are not trapped in chat history. Calendar and Sheet stay updated.", GREEN)
    card(c, 310, 160, 225, 100, "Payment discipline", "Advance payment can be requested before confirmation when needed.", AMBER)
    card(c, 565, 160, 225, 100, "Owner visibility", "Dashboard, Calendar and Sheet together make status easier to audit.", PINK)
    draw_text(c, "Best pitch: not only a chatbot - a booking operations layer across WhatsApp, Google tools and payment workflow.", 82, 88, 680, FONT_BOLD, 15, 20, PINK)


def launch(c):
    brand_header(c, 10, "Launch checklist")
    title(c, "From enquiry to live client.", size=31)
    steps = [
        ("1", "Create workspace", "Client account exists"),
        ("2", "Connect WhatsApp API", "WABA and phone connected"),
        ("3", "Approve templates", "Meta approval received"),
        ("4", "Enable product", "PingBook active"),
        ("5", "Connect Google", "Calendar and Sheet ready"),
        ("6", "Configure payment", "Razorpay path ready if required"),
        ("7", "Run sandbox booking", "Booking appears in Calendar and Sheet"),
        ("8", "Go live", "Monitoring and support path active"),
    ]
    x, y = 58, 330
    for i, (num, head, copy) in enumerate(steps):
        rounded(c, x, y, 340, 54, CARD, LINE, 10)
        icon_dot(c, x + 28, y + 27, [PINK, BLUE, GREEN, AMBER][i % 4], num)
        draw_text(c, head, x + 58, y + 31, 230, FONT_BOLD, 12, 14, INK)
        draw_text(c, copy, x + 58, y + 14, 250, FONT_REGULAR, 10, 12, MUTED)
        x += 382
        if x > 600:
            x = 58
            y -= 68
    card(c, 64, 38, 335, 88, "Important note", "Live automation depends on each client's Meta template approval and Google authorization.", AMBER)
    card(c, 438, 38, 335, 88, "Sales positioning", "Sell it as a practical appointment operations product, not a generic bot.", PINK)


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=landscape(A4))
    c.setTitle("AiFrogi PingBook Client E-Brochure")
    c.setAuthor("AiFrogi")
    pages = [cover, audience_1, audience_2, problem, workflow, trusted, features_1, features_2, outcomes, launch]
    for i, fn in enumerate(pages):
        fn(c)
        if i < len(pages) - 1:
            c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()
