from pathlib import Path
import shutil
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image

root=Path(__file__).resolve().parents[1]
out=root/'output/pdf/AiFrogi-Connector-Requirements-and-Charges.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
s=getSampleStyleSheet()
s.add(ParagraphStyle(name='BodyA',fontName='Helvetica',fontSize=10,leading=15,spaceAfter=9,textColor=colors.HexColor('#454545')))
s.add(ParagraphStyle(name='TitleA',fontName='Helvetica-Bold',fontSize=24,leading=29,spaceAfter=16))
s.add(ParagraphStyle(name='HeadingA',fontName='Helvetica-Bold',fontSize=13,leading=18,spaceBefore=10,spaceAfter=6,textColor=colors.HexColor('#806114')))
story=[]
def p(t,style='BodyA'):return Paragraph(t,s[style])
def section(title,text):story.extend([p(title,'HeadingA'),p(text)])
logo=root/'public/brand/aifrogi-logo-black.png'
if logo.exists():story.extend([Image(str(logo),width=45*mm,height=14*mm,kind='proportional'),Spacer(1,8*mm)])
story.extend([p('Prepare your connector','TitleA'),p('Customer checklist | Version 1 | 6 September 2026')])
section('Start with these details','Business name, website, AiFrogi account email, bot category, authorised owner and technical contact. Tell us what the bot should read, what it may change, business hours, timezone, expected usage and the fallback contact.')
section('Google Sheets','Provide the spreadsheet link, worksheet names, column headings and fictional sample rows. Identify the row key (for example, booking ID), who maintains the data and the fields the bot may read or update. Confirm data-retention requirements. Authorise access through the approved Google connection; do not share your Google password.')
section('Google Calendar','Name the calendar and account owner. Provide appointment types, duration, working days, timezone, breaks, buffer time, capacity, cancellation rules and required customer details. Use controlled test appointments before enabling live bookings.')
section('Razorpay','Provide your business account status, test-mode availability, currency, payment purpose, amount rules and receipt/refund requirements. Name the authorised account administrator. Test credentials and webhook secrets must be entered through a secure setup channel agreed with AiFrogi, never in this document, email or chat. Live payment actions need separate testing and approval.')
section('PMS / channel manager / custom API','Provide vendor and product name, property/location identifiers, API documentation link, vendor technical contact and sandbox availability. Specify room/rate mappings, availability rules and allowed reservation actions. Confirm whether vendor approval or a paid API plan is required. Never include guest records in an initial email.')
story.append(PageBreak())
story.append(p('Scope, charges & approval','TitleA'))
section('Indicative published connector ranges','Simple (Google Sheets / Calendar): INR 1,500-2,500 one time.<br/>Complex (CRM, ecommerce, custom payment flow): INR 5,000-8,000 one time.<br/>High complexity (PMS, channel manager, custom API): INR 8,000-15,000 indicative one time.<br/><b>These are current published ranges, not a binding quote or a guarantee that every integration fits the range.</b> Final scope and price must be approved before work begins.')
section('What the written quotation must include','The exact business account, connector and workflow; permitted read/write actions; field mapping; configuration; controlled testing; acceptance criteria; expected completion dependencies; handover; and the period of post-setup support. Extra workflows, vendor changes and ongoing maintenance are separately agreed, not silently included.')
section('Separate charges','The AI Bot subscription, applicable taxes, provider API/transaction fees and custom maintenance remain separate unless the quotation expressly includes them. WhatsApp standard onboarding currently has a separate INR 4,500 setup scope; do not assume that fee applies to every web-bot connector. Avoid duplicate charges for work already included in an approved package.')
section('Bot usage','Trial: 15 days, 100 AI replies and 500 total messages.<br/>Starter: INR 499 monthly or INR 4,999 yearly; published allowance of 1,000 AI replies and 5,000 total messages. Confirm the allowance reset period in your order.<br/>Additional usage requires a disclosed price and your approval before purchase. No usage-pack rate is promised in this guide. Review current pricing at https://aifrogi.com/pricing.')
section('Approval before live actions','1. Agree the scope and quotation.<br/>2. Authorise scoped access securely.<br/>3. Test with fictional or explicitly approved records.<br/>4. Check success, duplicate handling, failure and cancellation behaviour.<br/>5. Approve the workflow before live activation. A connected account alone does not certify a live action.')
section('Send requirements - not secrets','Email info@aifrogi.com or call +91-7410582898. Send business requirements and public documentation only. Do not email passwords, OTPs, API keys, patient records or payment-card details.')
def footer(c,d):
 c.setFont('Helvetica',8);c.setFillColor(colors.HexColor('#777777'));c.drawString(18*mm,12*mm,'AiFrogi | Connector preparation | v1 - 6 Sep 2026');c.drawRightString(192*mm,12*mm,str(d.page))
SimpleDocTemplate(str(out),pagesize=A4,leftMargin=18*mm,rightMargin=18*mm,topMargin=18*mm,bottomMargin=22*mm,title='AiFrogi Connector Requirements and Charges').build(story,onFirstPage=footer,onLaterPages=footer)
shutil.copy2(out,root/'public/downloads'/out.name)
print(out)
