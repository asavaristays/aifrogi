#!/usr/bin/env python3
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "downloads" / "AiFrogi-HotelGPT-Quick-Start-Manual.pdf"
INK = colors.HexColor("#101010")
GOLD = colors.HexColor("#9B7613")
PALE = colors.HexColor("#FFF8E7")
MUTED = colors.HexColor("#68645C")
GREEN = colors.HexColor("#176B50")
RED = colors.HexColor("#A12B24")

styles = getSampleStyleSheet()
title = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=30, textColor=INK, spaceAfter=8)
h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=INK, spaceAfter=8)
h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=GOLD, spaceBefore=7, spaceAfter=3)
body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14, textColor=MUTED, spaceAfter=5)
small = ParagraphStyle("Small", parent=body, fontSize=8, leading=11)
center = ParagraphStyle("Center", parent=body, alignment=TA_CENTER)
bullet = ParagraphStyle("Bullet", parent=body, leftIndent=12, firstLineIndent=-7, bulletIndent=5, spaceAfter=3)

def p(text, style=body): return Paragraph(text, style)
def bullets(items): return [p(f"• {item}", bullet) for item in items]
def banner(label, text, colour=GOLD):
    table = Table([[p(f"<b>{label}</b>", small), p(text, small)]], colWidths=[37*mm, 130*mm])
    table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), PALE), ("BOX", (0,0), (-1,-1), .7, colour), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 7), ("RIGHTPADDING", (0,0), (-1,-1), 7), ("TOPPADDING", (0,0), (-1,-1), 7), ("BOTTOMPADDING", (0,0), (-1,-1), 7)]))
    return table

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#DED8CB")); canvas.line(20*mm, 14*mm, 190*mm, 14*mm)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 9*mm, "AiFrogi HotelGPT · Quick Start Manual · Client setup")
    canvas.drawRightString(190*mm, 9*mm, f"Page {doc.page}")
    canvas.restoreState()

story = [
    Spacer(1, 7*mm), p("AiFrogi", ParagraphStyle("Brand", parent=h2, fontSize=13, textColor=GOLD)),
    p("HotelGPT Quick Start", title), p("Activate your 15-day public trial, check the website knowledge, and complete the hotel workbook.", ParagraphStyle("Deck", parent=body, fontSize=12, leading=18)),
    Spacer(1, 5*mm), banner("HOW ACTIVATION WORKS", "Verify your email and create your password. HotelGPT reads the official website supplied during signup. If readable hotel information is found, the basic public trial bot is activated automatically."),
    Spacer(1, 6*mm), p("1. Open your activation email", h1),
    *bullets(["Use the business owner's email activation link within 24 hours.", "Create a private password of at least 10 characters. The password is never emailed or placed in the QR code.", "The 15-day trial begins when the account is activated."]),
    p("2. Website crawl creates the basic bot", h2),
    *bullets(["HotelGPT reads public pages only. It never asks for website admin access.", "A successful crawl activates the standalone bot and website installation code.", "If the website is unavailable, protected or unreadable, the workspace remains safe in setup mode and shows how to retry."]),
    p("Basic-bot boundary", h2), banner("PUBLIC INFORMATION ONLY", "The basic bot may answer from readable first-party website information and offer human assistance. It cannot confirm live availability, a booking or payment without separately verified system evidence.", GREEN),
    Spacer(1, 5*mm), p("What arrives with the activation email", h2),
    *bullets(["Public HotelGPT link and QR when the crawl succeeds.", "JavaScript/WordPress and iFrame installation code when the crawl succeeds.", "Blank protected HotelGPT onboarding workbook.", "This four-page setup manual."]),
    PageBreak(),
    p("Complete the HotelGPT workbook", title),
    p("The website creates the basic bot. The workbook adds the complete, hotel-approved source of truth.", body),
    banner("USE THE BLANK WORKBOOK", "The client-reference workbook contains fictional data and must never be uploaded as hotel information.", RED),
    Spacer(1, 5*mm), p("Colour guide", h1),
    Table([[p("YELLOW", small), p("Hotel must complete or replace the sample.", small)], [p("BLUE", small), p("Optional language, variation or visibility information.", small)], [p("GREEN", small), p("Hotel approval or progress decision.", small)], [p("GREY", small), p("Protected AiFrogi reference/system field.", small)]], colWidths=[35*mm,132*mm], style=TableStyle([("GRID",(0,0),(-1,-1),.4,colors.HexColor("#DED8CB")),("BACKGROUND",(0,0),(0,-1),PALE),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])),
    Spacer(1, 5*mm), p("Recommended order", h1),
    *bullets(["Business Profile — identity, public contacts, privacy, escalation and responsible approvers.", "Approved FAQs — replace applicable samples; use the custom rows for hotel-specific questions.", "Tariff & Payment — one row per property, room, meal plan and validity period.", "Pre-Stay SOP — booking, tariff, location, distance, amenities, multipart and callback handling.", "In-Stay SOP — verified-guest department routing, SLA, escalation and completion.", "Source Register — website, PDF, policies, menus and authorised corrections.", "Photo Library — public HTTPS URLs, captions, usage rights and guest visibility.", "Verification and Launch Approval — completed using evidence during final review."]),
    p("Information never entered", h2),
    banner("SECURITY", "Never enter passwords, OTPs, UPI PINs, card numbers, CVV, API keys, private access links, identity documents or guest records in the workbook or public chat.", RED),
    PageBreak(),
    p("Upload, preview and correct", title),
    p("HotelGPT does not treat every spreadsheet cell as approved knowledge. The importer checks status, visibility and supporting evidence.", body),
    p("1. Upload", h1), *bullets(["Open the onboarding workspace and choose the completed .xlsx file.", "Keep the original sheet names and protected structure.", "The workbook must remain below the stated upload limit."]),
    p("2. Validate and preview", h1), *bullets(["Check the hotel name, website and contact owner.", "Review the number of approved answers, variants, SOPs, sources, photos and launch gates.", "Samples, blank rows, Pending rows and Staff-only tariffs are excluded."]),
    p("3. Correct conflicts", h1), *bullets(["A website/PDF difference becomes a finding; it never silently overwrites the hotel's approved answer.", "Update the correct source, answer and review date.", "Use one stable property code throughout the workbook."]),
    p("4. Confirm information", h1), *bullets(["Only confirm information that the hotel is authorised to publish.", "New answers are staged for review and remain traceable to the uploaded workbook.", "Keep tariff validity, tax, inclusions, exclusions and exceptions explicit."]),
    banner("PHOTO CONTROL", "A photograph becomes eligible only when its URL is public HTTPS, Guest-visible is Yes, usage rights are confirmed and Hotel approval is Approved. An image never proves live availability or inclusion.", GREEN),
    PageBreak(),
    p("Test, install and operate safely", title),
    p("Use real guest wording, but use fictional contact and booking details during testing.", body),
    p("Minimum test set", h1), *bullets(["Hotel identity and public contact details.", "Room categories, occupancy and amenities.", "EP, CP, MAP and AP tariffs, tax, validity and inclusions.", "Cancellation, refund, no-show and payment-process boundaries.", "Location, airport/station distance and transfer options.", "English variation, common typo and Hinglish wording.", "Multipart question covering at least two hotel topics.", "Human callback consent and unsupported-question handover."]),
    p("Website installation", h1), *bullets(["Use the supplied JavaScript/WordPress code for most websites.", "Use the iFrame only where script installation is unavailable.", "The standalone link works independently of the hotel website.", "Installation never grants website admin access to AiFrogi."]),
    p("Trial and paid continuation", h1), *bullets(["The public trial remains subject to usage limits, security and acceptable-use controls.", "Verified payment continues the eligible bot without changing approved knowledge.", "PMS, Payment Gateway and other add-ons require separate scoped setup and tests.", "AiFrogi may request correction, restrict a feature or suspend serious non-compliance under the accepted service terms."]),
    banner("NEED HELP?", "Email info@aifrogi.com or call +91-7410582898. Include the hotel name and the exact screen or workbook row—never send a password or OTP."),
    Spacer(1, 8*mm), p("HotelGPT · Simple public trial activation. Governed hotel intelligence. Human control for sensitive actions.", center)
]

OUT.parent.mkdir(parents=True, exist_ok=True)
doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=17*mm, bottomMargin=20*mm, title="AiFrogi HotelGPT Quick Start Manual", author="AiFrogi")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
