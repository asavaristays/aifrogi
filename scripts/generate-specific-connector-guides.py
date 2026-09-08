"""One branded customer checklist per connector; prices share the website data."""
import json
from pathlib import Path
from shutil import copyfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from xml.sax.saxutils import escape

root = Path(__file__).resolve().parents[1]
out = root / 'output/pdf'
out.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Copy', fontName='Helvetica', fontSize=10, leading=14, spaceAfter=6))
styles.add(ParagraphStyle(name='Section', fontName='Helvetica-Bold', fontSize=12, leading=16, textColor=colors.HexColor('#735710'), spaceBefore=10, spaceAfter=6))
styles.add(ParagraphStyle(name='Hero', fontName='Helvetica-Bold', fontSize=22, leading=26, spaceAfter=10))

def footer(canvas, doc):
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#666666'))
    canvas.drawString(18*mm, 13*mm, 'AiFrogi | Customer connector checklist | 6 September 2026')
    canvas.drawRightString(192*mm, 13*mm, str(doc.page))

for guide in json.loads((root/'data/connector-guides.json').read_text()):
    path = out / f"AiFrogi-{guide['id']}-Checklist.pdf"
    story = []
    logo = Image(str(root/'public/brand/aifrogi-logo-black.png'), width=45*mm, height=14*mm, kind='proportional')
    logo.hAlign = 'LEFT'
    story.extend([logo, Spacer(1, 8*mm)])
    def p(text, style='Copy'): story.append(Paragraph(escape(text), styles[style]))
    p(guide['name'], 'Hero')
    p('Preparation checklist - send requirements, not passwords')
    p('Suitable workflows: '+guide['bots'])
    p('What this can enable', 'Section')
    p(guide['enables']+' Features go live only after configuration, approval and successful testing.')
    p('What to prepare', 'Section')
    for i, item in enumerate(guide['prepare'], 1): p(f'{i}. {item}')
    p('Scope and exclusions', 'Section')
    p(guide['excludes'])
    p('Setup and ongoing costs', 'Section')
    p(guide['fee']+'. One-time estimate, not an automatic charge. Final scope and price require your written approval before work begins.')
    p('Agreed setup covers configuration, field mapping, controlled tests and handover for the named workflow. Bot subscription, taxes, provider API/transaction fees, extra workflows and ongoing maintenance are separate unless included in your quotation.')
    p('Next step', 'Section')
    p('Email the non-secret checklist details to info@aifrogi.com or call +91-7410582898. We confirm scope and permissions, connect securely, test with your approval, then enable the workflow. Never email passwords, API secrets, OTPs or real sensitive customer records.')
    SimpleDocTemplate(str(path), pagesize=A4, leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=22*mm).build(story, onFirstPage=footer, onLaterPages=footer)
    copyfile(path, root/'public/downloads'/path.name)
    print(path.name)
