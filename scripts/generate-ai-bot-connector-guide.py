from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from reportlab.pdfbase.pdfmetrics import stringWidth
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/AiFrogi-AI-Bot-Connector-and-Installation-Guide.pdf"
PUBLIC = ROOT / "public/downloads/AiFrogi-AI-Bot-Connector-and-Installation-Guide.pdf"
LOGO = ROOT / "public/brand/aifrogi-logo-black.png"

INK = colors.HexColor("#101010")
GOLD = colors.HexColor("#9B7613")
PALE_GOLD = colors.HexColor("#FFF7E3")
CREAM = colors.HexColor("#F7F5F0")
MUTED = colors.HexColor("#666158")
GREEN = colors.HexColor("#176B50")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Eyebrow", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=GOLD, spaceAfter=6, uppercase=True, tracking=1.2))
styles.add(ParagraphStyle(name="H1A", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=29, leading=33, textColor=INK, spaceAfter=14))
styles.add(ParagraphStyle(name="H2A", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=17, leading=22, textColor=INK, spaceBefore=8, spaceAfter=8))
styles.add(ParagraphStyle(name="BodyA", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.6, leading=14, textColor=MUTED, spaceAfter=8))
styles.add(ParagraphStyle(name="SmallA", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.5, textColor=MUTED))
styles.add(ParagraphStyle(name="CardTitle", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=INK))
styles.add(ParagraphStyle(name="CardBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED))
styles.add(ParagraphStyle(name="Header", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10.5, textColor=colors.white))

bots = [
    ("BusinessGPT", "Business questions, lead qualification and human handover.", "CRM or Google Sheets", "Consultation calendar", "Live CRM lead sync or confirmed consultation booking."),
    ("ClinicGPT", "Clinic information and appointment requests. Medical advice remains with the clinic.", "Google Calendar or clinic system", "Google Sheets; payment gateway", "Live slots, appointment confirmation, reschedule/cancellation and verified deposit status."),
    ("HotelGPT", "Property information and stay enquiries.", "PMS, channel manager or booking engine", "Payment gateway", "Live availability, rates, restrictions, booking holds and verified booking status."),
    ("DineGPT", "Menu questions and reservation requests. It never guesses allergen data.", "Reservation system or Google Calendar", "Deposit payment provider", "Live table capacity, confirmed reservations and verified deposits."),
    ("PropertyGPT", "Approved listings, buyer qualification and site-visit requests.", "Property CRM or inventory system", "Site-visit calendar", "Live listing status, agent assignment and confirmed site visits."),
    ("eduGPT", "Programme information, admissions enquiries and counselling requests.", "Admissions CRM or Google Sheets", "Counselling calendar", "Consented enquiry sync and confirmed counselling/campus visits."),
    ("FlowCart", "Approved catalogue and product enquiries.", "Shopify or WooCommerce", "Razorpay or approved payment provider", "Live price/stock, cart/order creation, payment and fulfilment confirmation."),
    ("Custom Bot", "A governed workflow based on approved knowledge and a defined authority model.", "Client system of record", "Defined per workflow", "Only the exact read/write actions documented and tested for the customer."),
]

def p(text, style="BodyA"):
    return Paragraph(text, styles[style])

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#E5DFD2"))
    canvas.line(18*mm, 14*mm, 192*mm, 14*mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 9.5*mm, "AiFrogi - AI Bot Connector & Installation Guide")
    canvas.drawRightString(192*mm, 9.5*mm, f"Page {doc.page}")
    canvas.restoreState()

def table(rows, widths):
    result = Table(rows, colWidths=widths, repeatRows=1, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), INK), ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("FONTSIZE", (0,0), (-1,0), 8),
        ("LEADING", (0,0), (-1,-1), 11.5), ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"), ("FONTSIZE", (0,1), (-1,-1), 8.1),
        ("TEXTCOLOR", (0,1), (-1,-1), MUTED), ("BACKGROUND", (0,1), (-1,-1), colors.white),
        ("GRID", (0,0), (-1,-1), 0.35, colors.HexColor("#E5DFD2")), ("LEFTPADDING", (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    return result

story = []
if LOGO.exists():
    logo = Image(str(LOGO), width=48*mm, height=14*mm, kind="proportional")
    story += [logo, Spacer(1, 18*mm)]
story += [p("CLIENT INSTALLATION GUIDE", "Eyebrow"), p("AI Bot connector and installation guide", "H1A"),
          p("A simple guide for choosing the right AiFrogi bot, preparing approved knowledge and connecting external systems safely.", "BodyA"), Spacer(1, 7*mm)]
cover_box = Table([[p("<b>Start with the bot.</b><br/>Every AiFrogi bot can begin with approved knowledge, a website widget and human handover. A connector is only required when the bot must read live information or confirm an action in another system.", "CardBody")]], colWidths=[174*mm])
cover_box.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), PALE_GOLD), ("BOX", (0,0), (-1,-1), 0.6, GOLD), ("LEFTPADDING", (0,0), (-1,-1), 13), ("RIGHTPADDING", (0,0), (-1,-1), 13), ("TOPPADDING", (0,0), (-1,-1), 13), ("BOTTOMPADDING", (0,0), (-1,-1), 13)]))
story += [cover_box, Spacer(1, 12*mm), p("Your installation path", "H2A")]
steps = [["1", "Choose", "Select the AI Bot that matches your customer journey."], ["2", "Prepare", "Provide approved business details, FAQs and public source links."], ["3", "Review", "Approve the bot's conversational preview before publication."], ["4", "Install", "Add the website script, WordPress block or use the standalone link."], ["5", "Connect", "Enable only the verified connectors required for live actions."], ["6", "Go live", "AiFrogi completes final readiness and monitors the launch."]]
story.append(table([[p("Step", "Header"), p("What happens", "Header"), p("Your action", "Header")]] + [[p(a,"CardBody"),p(b,"CardTitle"),p(c,"CardBody")] for a,b,c in steps], [18*mm, 38*mm, 118*mm]))
story.append(PageBreak())

story += [p("INSTALL BEFORE CONNECTORS", "Eyebrow"), p("The standard website installation", "H1A"),
          p("Complete the bot foundation first. The same foundation is used whether you add a connector now or later.", "BodyA")]
install = [["What AiFrogi provides", "What your team does"],
           ["Website JavaScript snippet", "Paste it before the closing </body> tag or in your website's approved footer-code area."],
           ["WordPress option", "Add the same snippet through a Custom HTML block, header/footer-code plugin or your developer's approved method."],
           ["Standalone link", "Use it for QR codes, social profiles, WhatsApp bio links, SMS or a website-free launch."],
           ["Preview and readiness checks", "Approve approved answers. Do not request live claims or actions until the relevant connector is verified."]]
story.append(table([[p(a,"Header"),p(b,"Header")] if i == 0 else [p(a,"CardBody"),p(b,"CardBody")] for i,(a,b) in enumerate(install)], [65*mm, 109*mm]))
story += [Spacer(1, 9*mm), p("Before you upload", "H2A"), p("Use the AiFrogi onboarding Excel file or complete details in your workspace. Include public, approved information only: business identity, contact details, services, FAQs, business hours, human-handover contact and approved source pages. Imported FAQ answers are staged for review; they do not go live automatically.", "BodyA")]
warning = Table([[p("<b>Never send credentials.</b><br/>Do not put passwords, OTPs, private API keys, payment-card details or secret tokens in the Excel workbook or email. Connector access is configured separately through secure, scoped setup.", "CardBody")]], colWidths=[174*mm])
warning.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#FDEDEC")), ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#C84A43")), ("LEFTPADDING", (0,0), (-1,-1), 12), ("RIGHTPADDING", (0,0), (-1,-1), 12), ("TOPPADDING", (0,0), (-1,-1), 11), ("BOTTOMPADDING", (0,0), (-1,-1), 11)]))
story += [warning, PageBreak()]

story += [p("CONNECTOR OVERVIEW", "Eyebrow"), p("Which connector does each bot need?", "H1A"), p("The first two columns help a customer decide what is needed for a knowledge-led launch. The final column is the boundary: without a verified connector, the bot must capture a request or hand over instead of claiming the live outcome.", "BodyA")]
rows = [[p("AI Bot", "Header"), p("Works before connector", "Header"), p("Primary connector", "Header"), p("Live action enabled", "Header")]]
for bot, base, primary, optional, live in bots:
    rows.append([p(bot,"CardTitle"), p(base,"CardBody"), p(primary,"CardBody"), p(live,"CardBody")])
story.append(table(rows, [27*mm, 47*mm, 49*mm, 51*mm]))
story.append(PageBreak())

for idx, (bot, base, primary, optional, live) in enumerate(bots):
    if idx and idx % 2 == 0: story.append(PageBreak())
    story += [p("BOT CONNECTOR REQUIREMENT", "Eyebrow"), p(bot, "H2A"), p(base, "BodyA")]
    cards = [[p("Primary connector", "Header"), p("Optional extension", "Header")], [p(primary, "CardBody"), p(optional, "CardBody")], [p("What it enables", "Header"), p("Safe behaviour until connected", "Header")], [p(live, "CardBody"), p("The bot can answer from approved knowledge, capture the customer request and hand it to your team. It will not invent availability, status, confirmation or payment success.", "CardBody")]]
    story.append(table(cards, [87*mm, 87*mm]))
    story += [Spacer(1, 4*mm), p("Connector setup checklist", "CardTitle"), p("1. Confirm the business owner and authorised system administrator.  2. Define exact read and write actions.  3. Connect through the approved secure flow.  4. Test sandbox or controlled data.  5. Verify read-back, error handling and human handover.  6. Enable the action only after AiFrogi approval.", "CardBody"), Spacer(1, 9*mm)]

story.append(PageBreak())
story += [p("SAFE GO-LIVE", "Eyebrow"), p("What happens after a connector request", "H1A"), p("AiFrogi treats each connector as a governed operational change. Connecting a system does not automatically give the bot authority to act.", "BodyA")]
go_live = [["Stage", "AiFrogi control", "Customer responsibility"],
           ["Scope", "Records required actions, allowed data and safe fallback.", "Name the authorised owner and system of record."],
           ["Connect", "Configures secure scoped access without exposing credentials in chat or email.", "Approve the provider connection using the provider's official flow."],
           ["Test", "Checks read data, write idempotency, error handling and human handover.", "Provide controlled test records and confirm expected outcomes."],
           ["Approve", "Records connector readiness and action boundary.", "Approve that the business rules and customer-facing messages are correct."],
           ["Operate", "Monitors errors and disables unsafe actions when required.", "Keep business information and provider access current."]]
story.append(table([[p(a,"Header"),p(b,"Header"),p(c,"Header")] if i == 0 else [p(a,"CardBody"),p(b,"CardBody"),p(c,"CardBody")] for i,(a,b,c) in enumerate(go_live)], [28*mm, 73*mm, 73*mm]))
story += [Spacer(1, 10*mm), p("Need help?", "H2A"), p("For onboarding or a connector discussion, contact AiFrogi at <b>info@aifrogi.com</b> or WhatsApp <b>+91-7410582898</b>. Please mention your bot category, website and the system you want to connect.", "BodyA")]

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=18*mm, bottomMargin=20*mm, title="AiFrogi AI Bot Connector and Installation Guide", author="AiFrogi")
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
shutil.copy2(OUT, PUBLIC)
print(OUT)
