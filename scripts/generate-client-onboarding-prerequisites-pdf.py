from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Image
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "AiFrogi-Client-Onboarding-Prerequisites.pdf"
LOGO = ROOT / "public" / "brand" / "aifrogi-logo-black.png"
OUT.parent.mkdir(parents=True, exist_ok=True)

BLACK = colors.HexColor("#050505")
DEEP = colors.HexColor("#101010")
GRAPHITE = colors.HexColor("#404040")
GOLD = colors.HexColor("#8A6A16")
ANTIQUE = colors.HexColor("#B28728")
PALE = colors.HexColor("#F3E5B5")
CREAM = colors.HexColor("#F7F4ED")
GREY = colors.HexColor("#6B6B68")
GREEN = colors.HexColor("#167D5A")

font_regular = "/System/Library/Fonts/Supplemental/Arial.ttf"
font_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
if Path(font_regular).exists():
    pdfmetrics.registerFont(TTFont("AIFRegular", font_regular))
    pdfmetrics.registerFont(TTFont("AIFBold", font_bold))
else:
    font_regular, font_bold = "Helvetica", "Helvetica-Bold"

styles = getSampleStyleSheet()
body = ParagraphStyle("Body", fontName="AIFRegular", fontSize=9.3, leading=14, textColor=GRAPHITE, spaceAfter=5)
small = ParagraphStyle("Small", parent=body, fontSize=7.6, leading=10.5, textColor=GREY)
h1 = ParagraphStyle("H1", fontName="AIFBold", fontSize=26, leading=30, textColor=BLACK, spaceAfter=8)
h2 = ParagraphStyle("H2", fontName="AIFBold", fontSize=17, leading=21, textColor=BLACK, spaceBefore=5, spaceAfter=8)
h3 = ParagraphStyle("H3", fontName="AIFBold", fontSize=11, leading=14, textColor=GOLD, spaceBefore=4, spaceAfter=4)
label = ParagraphStyle("Label", fontName="AIFBold", fontSize=7.3, leading=9, textColor=GOLD, uppercase=True)
white = ParagraphStyle("White", fontName="AIFRegular", fontSize=9.4, leading=14, textColor=colors.white)
white_bold = ParagraphStyle("WhiteBold", fontName="AIFBold", fontSize=17, leading=21, textColor=colors.white)
center_small = ParagraphStyle("CenterSmall", parent=small, alignment=TA_CENTER)

def P(text, style=body): return Paragraph(text, style)

def checkbox(text):
    return Table([["", P(text)]], colWidths=[5*mm, 164*mm], style=TableStyle([
        ("BOX", (0,0), (0,0), .7, ANTIQUE), ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 2), ("RIGHTPADDING", (0,0), (-1,-1), 3),
        ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ]))

def checklist(text):
    return checkbox(text)

def info_card(title, text, width=55*mm):
    return Table([[P(title, h3)], [P(text, small)]], colWidths=[width], style=TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), CREAM), ("BOX", (0,0), (-1,-1), .6, colors.HexColor("#D7D1C5")),
        ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ]))

def page_header(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFillColor(BLACK); canvas.rect(0, A4[1]-15*mm, A4[0], 15*mm, fill=1, stroke=0)
        canvas.setFont("AIFRegular", 7.5); canvas.setFillColor(colors.white)
        canvas.drawString(18*mm, A4[1]-9.5*mm, "AiFrogi  |  Client Onboarding Prerequisites")
        canvas.setFillColor(ANTIQUE); canvas.drawRightString(A4[0]-21*mm, A4[1]-9.5*mm, f"PAGE {doc.page}")
    canvas.setFont("AIFRegular", 7); canvas.setFillColor(GREY)
    canvas.drawString(18*mm, 10*mm, "Prepare approved information only. Never send passwords, OTPs or payment-card details.")
    canvas.drawRightString(A4[0]-18*mm, 10*mm, "info@aifrogi.com  |  +91 74105 82898")
    canvas.restoreState()

story = []
story.append(Spacer(1, 5*mm))
if LOGO.exists():
    img = Image(str(LOGO), width=48*mm, height=16*mm); img.hAlign = "LEFT"; story.append(img)
story += [Spacer(1, 8*mm), P("CLIENT PREPARATION GUIDE", label), P("AI Bot onboarding prerequisites", h1),
          P("Prepare these details before opening the onboarding form. Complete and approved information helps AiFrogi configure the right persona, build a trustworthy knowledge base, test customer journeys and activate your bot faster."), Spacer(1, 4*mm)]

story.append(Table([[P("YOUR PREPARATION GOAL", white_bold), P("One approved business profile, one clearly defined bot purpose, trustworthy knowledge, installation access and a responsible owner for review.", white)]], colWidths=[56*mm, 112*mm], style=TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), BLACK), ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9),
])))
story += [Spacer(1, 6*mm), P("What happens after you submit", h2)]
steps = [
    ("1. REVIEW", "AiFrogi checks business identity, bot category and required fields."),
    ("2. BUILD", "Approved information is converted into structured, traceable bot knowledge."),
    ("3. PREVIEW", "You test the actual answers, journeys, refusals and human handover."),
    ("4. INSTALL", "You receive website script, iframe, WordPress guidance and a standalone bot link."),
    ("5. ACTIVATE", "After installation detection and final approval, Super Admin enables the bot live."),
]
story.append(Table([[info_card(a,b,32*mm) for a,b in steps]], colWidths=[34*mm]*5, hAlign="CENTER", style=TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"), ("LEFTPADDING",(0,0),(-1,-1),1), ("RIGHTPADDING",(0,0),(-1,-1),1)])))
story += [Spacer(1, 7*mm), P("Before you begin", h2)]
story.append(checklist("Nominate one business owner who can approve facts and one technical contact who can install the widget."))
story.append(checklist("Set aside 30-45 minutes for data entry and 20-30 minutes for preview-answer review."))
story.append(checklist("Keep final documents, website links, images and spreadsheets in one folder before starting."))
story.append(checklist("Use business information that is current, authorised and suitable for customers."))
story += [Spacer(1, 5*mm), Table([[P("15-DAY TRIAL", h3), P("The trial begins when your bot is activated. Day 13 and Day 15 reminders explain how to continue on a paid plan. Trial activation does not bypass knowledge, safety or installation checks.", body)]], colWidths=[35*mm,133*mm], style=TableStyle([("BACKGROUND",(0,0),(-1,-1),PALE),("BOX",(0,0),(-1,-1),.7,ANTIQUE),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])), PageBreak()]

story += [P("1", label), P("Business and bot identity", h1), P("These details establish who the bot represents, what it may do and when a human must take control."), Spacer(1,3*mm)]
story.append(checklist("Legal business name, trading name, owner/authorised representative and GST/registration number, where applicable."))
story.append(checklist("Complete business address, Google Maps location link, website URL, public email, public phone and operating hours."))
story.append(checklist("Business category and selected bot: BusinessGPT, ClinicGPT, HotelGPT, DineGPT, eduGPT, PropertyGPT, FlowCart or Custom Bot."))
story.append(checklist("One-sentence bot objective, such as: answer approved enquiries, qualify leads and request appointments."))
story.append(checklist("Customer channels required: website widget, standalone bot link, WhatsApp API, or a combination."))
story.append(checklist("Bot display name, welcome message, preferred language(s), tone and the team name used during handover."))
story.append(checklist("Named AI Bot Admin who will review conversations, knowledge gaps, feedback and day-to-day operations."))
story += [Spacer(1,6*mm), P("Brand assets", h2)]
brand_data = [
    [P("ITEM", label), P("RECOMMENDED FORMAT", label), P("NOTES", label)],
    [P("Logo"), P("PNG or SVG; transparent background"), P("Clear at small widget size")],
    [P("Business photos"), P("JPG/WebP; sharp, current"), P("Exterior, interior, products, rooms, campus or properties")],
    [P("Brand colours"), P("HEX values, if available"), P("Primary, secondary and accessible contrast")],
    [P("Google location"), P("Published Maps link"), P("Confirm pin and displayed business name")],
]
story.append(Table(brand_data, colWidths=[35*mm,58*mm,75*mm], repeatRows=1, style=TableStyle([
    ("BACKGROUND",(0,0),(-1,0),BLACK),("TEXTCOLOR",(0,0),(-1,0),colors.white),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#D7D1C5")),
    ("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)
])))
story += [Spacer(1,6*mm), P("Authority boundaries", h2), P("State what the bot may answer, recommend, qualify or prepare. Separately list actions that require human approval - for example medical judgment, legal conclusions, negotiated prices, refunds, payment approval, room confirmation without live inventory, or access to private student/customer data."), PageBreak()]

story += [P("2", label), P("Approved knowledge to prepare", h1), P("AiFrogi answers from approved business sources. More content is not automatically better; current, specific and internally consistent content is better."), Spacer(1,3*mm)]
story.append(checklist("Official website pages and active links. Remove old, duplicate, private or unpublished URLs from the submission."))
story.append(checklist("Services/products with descriptions, eligibility, inclusions, exclusions, price or price rules, and effective dates."))
story.append(checklist("Frequently asked questions and the exact approved answer for each."))
story.append(checklist("Policies: cancellation, refund, delivery, appointment, booking, privacy, child/minor data, emergency and escalation."))
story.append(checklist("Customer journey: common enquiry, qualification questions, next step, confirmation language and human handover point."))
story.append(checklist("Contact details and hours, including who handles sales, support, reservations, admissions or emergencies."))
story.append(checklist("Excel/CSV imports with one fact per row, clear column names, source, owner, last reviewed date and expiry/review date."))
story += [Spacer(1,5*mm), P("Category-specific preparation", h2)]
category_rows = [
    [P("BOT", label), P("PREPARE THESE ITEMS", label)],
    [P("ClinicGPT", h3), P("Treatments, practitioner/clinic hours, appointment duration, available-slot source, fees, preparation instructions, cancellation rules and emergency disclaimer.")],
    [P("HotelGPT", h3), P("Room types, occupancy, amenities, meal plans, policies, check-in/out, local information, rate rules and PMS/channel-manager connector owner.")],
    [P("DineGPT", h3), P("Menu, prices, hours, table rules, party sizes, dietary/allergen statements, delivery zones, reservation policy and event-enquiry process.")],
    [P("eduGPT", h3), P("Programmes, eligibility, fees, schedules, locations, counselling process, admission dates, required documents and minor-data restrictions.")],
    [P("PropertyGPT", h3), P("Approved listings, location, configuration, area, price/range, amenities, availability status, visit process and legal-information boundaries.")],
    [P("FlowCart", h3), P("Catalogue/SKU, variants, prices, tax, stock source, delivery/collection, payment-link process, order changes and return/refund policy.")],
    [P("Business/Custom", h3), P("Services, lead fields, qualification rules, workflow steps, approvals, response SLA and the connector action contract.")],
]
story.append(Table(category_rows, colWidths=[42*mm,126*mm], repeatRows=1, style=TableStyle([
    ("BACKGROUND",(0,0),(-1,0),BLACK),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#D7D1C5")),("VALIGN",(0,0),(-1,-1),"TOP"),
    ("LEFTPADDING",(0,0),(-1,-1),5),("RIGHTPADDING",(0,0),(-1,-1),5),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5)
])))
story += [Spacer(1,5*mm), Table([[P("IMPORTANT", h3), P("If two approved sources conflict, the affected claim is paused. AiFrogi must not guess which version is correct. Your authorised owner must resolve the conflict before publication.", body)]], colWidths=[30*mm,138*mm], style=TableStyle([("BACKGROUND",(0,0),(-1,-1),PALE),("BOX",(0,0),(-1,-1),.7,ANTIQUE),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])), PageBreak()]

story += [P("3", label), P("Installation and connector readiness", h1), P("Prepare access and ownership without sharing sensitive credentials in onboarding forms, email or chat."), Spacer(1,3*mm)]
story.append(checklist("Identify the website platform: WordPress, Shopify, custom HTML/JavaScript, React/Next.js, another CMS, or no website."))
story.append(checklist("Nominate the person who can add the AiFrogi script/iframe or WordPress code and publish the change."))
story.append(checklist("Confirm where the widget should appear and provide staging/test access if available."))
story.append(checklist("Confirm website domain, Content Security Policy or cookie/consent requirements that may affect embedding."))
story.append(checklist("For a standalone link, confirm business name, logo, preferred URL label and QR-code use."))
story.append(checklist("List each connector required: calendar, Google Sheet, CRM, PMS/channel manager, catalogue, payment provider, email or another API."))
story.append(checklist("For every connector, name the provider, account owner, intended read/write actions, approval boundary and test environment."))
story.append(checklist("Keep OAuth/admin access available for the authorised owner during the guided connection step. Do not send passwords or OTPs."))
story += [Spacer(1,6*mm), P("Connector truth rules", h2)]
story.append(Table([[info_card("READ", "Live data such as slots, inventory or status may be shown only when the approved connector returns it."), info_card("WRITE", "Bookings, orders, payments or updates require authority, idempotency and confirmation/read-back."), info_card("FAILURE", "If verification fails, the bot records the request or hands over. It never claims an action succeeded.")]], colWidths=[56*mm]*3, style=TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),1),("RIGHTPADDING",(0,0),(-1,-1),1)])))
story += [Spacer(1,7*mm), P("Security and privacy preparation", h2)]
security = [
    "List personal data the bot may collect and the exact customer consent text.",
    "Define retention/deletion requirements and the authorised team members who may view conversations.",
    "Exclude passwords, OTPs, payment-card details, private medical/student records and unnecessary identity documents.",
    "Provide an approved privacy-policy link and any sector-specific notices required by your organisation.",
    "Define emergency, complaint, vulnerable-person, legal, payment and high-risk escalation routes.",
]
for item in security: story.append(checklist(item))
story += [PageBreak(), P("4", label), P("Preview approval and go-live", h1), P("Your bot is activated only after the business owner reviews how approved facts sound in real customer conversations."), Spacer(1,3*mm)]
story.append(checklist("Test common questions, vague questions, spelling variations and follow-up questions."))
story.append(checklist("Test unavailable information, conflicting information and expired information."))
story.append(checklist("Test off-topic questions such as weather and identity questions such as 'Who are you?'"))
story.append(checklist("Test category safety boundaries, human handover and the two-clarification loop limit."))
story.append(checklist("Test each connector in a safe test/demo environment, including duplicate submission and connector failure."))
story.append(checklist("Read the bot's actual answers - not only the source spreadsheet - and approve or correct each material journey."))
story.append(checklist("Confirm widget appearance on desktop and mobile, privacy notice, feedback control and human-contact option."))
story.append(checklist("Authorised owner gives final preview sign-off; technical contact confirms installation; Super Admin enables live status."))
story += [Spacer(1,7*mm), P("Final handover information", h2)]
handover = [
    [P("BUSINESS OWNER", label), P("Name / email / phone: ______________________________________________")],
    [P("AI BOT ADMIN", label), P("Name / email / phone: ______________________________________________")],
    [P("TECHNICAL CONTACT", label), P("Name / email / phone: ______________________________________________")],
    [P("HUMAN HANDOVER", label), P("Team / hours / SLA: _________________________________________________")],
    [P("BOT + CHANNEL", label), P("Selected bot / website / link / WhatsApp: ______________________________")],
    [P("TARGET DATE", label), P("Preview: _______________________  Proposed activation: __________________")],
]
story.append(Table(handover, colWidths=[42*mm,126*mm], style=TableStyle([
    ("GRID",(0,0),(-1,-1),.5,colors.HexColor("#D7D1C5")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ("BACKGROUND",(0,0),(0,-1),CREAM),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)
])))
story += [Spacer(1,8*mm), Table([[P("READY TO ONBOARD?", white_bold), P("Keep this checklist beside you while completing the AiFrogi onboarding form. If a required item is unavailable, mark it for review rather than entering an assumption.", white)]], colWidths=[50*mm,118*mm], style=TableStyle([("BACKGROUND",(0,0),(-1,-1),BLACK),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)])), Spacer(1,5*mm), P("AiFrogi is the AI Business Automation vertical of Webtechnosys. Support: info@aifrogi.com | +91 74105 82898", center_small)]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=21*mm, bottomMargin=17*mm, title="AiFrogi Client Onboarding Prerequisites", author="AiFrogi")
doc.build(story, onFirstPage=page_header, onLaterPages=page_header)
print(OUT)
