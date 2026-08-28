#!/usr/bin/env python3
"""Generate the glossy AiFrogi full-scale project guidebook PDF."""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "aifrogi-full-scale-guidebook.pdf"
LOGO = Path("/Users/manishpurohit/Documents/aifrogi/logo/aifrogi-800x300-TRANSPARENT.png")

PAGE_W, PAGE_H = landscape(A4)

BRAND_DARK = colors.HexColor("#2B213A")
BRAND_DEEP = colors.HexColor("#17101F")
BRAND_MAGENTA = colors.HexColor("#E845E8")
BRAND_PINK = colors.HexColor("#FF7AF3")
BRAND_GREEN = colors.HexColor("#25D366")
BRAND_AMBER = colors.HexColor("#F6C453")
BRAND_BLUE = colors.HexColor("#5D7CFF")
INK = colors.HexColor("#1A1D24")
MUTED = colors.HexColor("#667085")
LIGHT_BG = colors.HexColor("#F6F3FA")
CARD = colors.white
LINE = colors.HexColor("#DDD7E8")


STYLES = {
    "title": ParagraphStyle(
        "title",
        fontName="Helvetica-Bold",
        fontSize=30,
        leading=34,
        textColor=colors.white,
        alignment=TA_LEFT,
    ),
    "subtitle": ParagraphStyle(
        "subtitle",
        fontName="Helvetica",
        fontSize=12.5,
        leading=17,
        textColor=colors.HexColor("#EDE6F8"),
    ),
    "h1": ParagraphStyle(
        "h1",
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=INK,
    ),
    "h2": ParagraphStyle(
        "h2",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=INK,
    ),
    "body": ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=INK,
    ),
    "small": ParagraphStyle(
        "small",
        fontName="Helvetica",
        fontSize=7.7,
        leading=10.2,
        textColor=MUTED,
    ),
    "white_small": ParagraphStyle(
        "white_small",
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=colors.white,
        alignment=TA_CENTER,
    ),
    "white_box": ParagraphStyle(
        "white_box",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=colors.white,
        alignment=TA_CENTER,
    ),
    "box": ParagraphStyle(
        "box",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10.5,
        textColor=INK,
        alignment=TA_CENTER,
    ),
    "box_small": ParagraphStyle(
        "box_small",
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.6,
        textColor=INK,
        alignment=TA_CENTER,
    ),
    "center": ParagraphStyle(
        "center",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=INK,
        alignment=TA_CENTER,
    ),
}


def safe(text: str) -> str:
    """Keep PDF text predictable and ASCII-hyphen friendly."""
    return (
        text.replace("—", "-")
        .replace("–", "-")
        .replace("“", '"')
        .replace("”", '"')
        .replace("’", "'")
        .replace("‘", "'")
        .replace("&", "&amp;")
    )


def para(c: canvas.Canvas, text: str, x: float, y_top: float, w: float, style="body", max_h: float | None = None):
    p = Paragraph(safe(text), STYLES[style])
    _, h = p.wrap(w, max_h or 1000)
    p.drawOn(c, x, y_top - h)
    return h


def pill(c: canvas.Canvas, text: str, x: float, y: float, w: float, h: float, fill=BRAND_MAGENTA, text_color=colors.white):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, h / 2, fill=1, stroke=0)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(x + w / 2, y + h / 2 - 2.2, safe(text))
    c.restoreState()


def arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, color=colors.HexColor("#8E82A2"), width=1.1):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)
    angle = math.atan2(y2 - y1, x2 - x1)
    size = 5
    a1 = angle + math.pi * 0.82
    a2 = angle - math.pi * 0.82
    c.line(x2, y2, x2 + math.cos(a1) * size, y2 + math.sin(a1) * size)
    c.line(x2, y2, x2 + math.cos(a2) * size, y2 + math.sin(a2) * size)
    c.restoreState()


def page_bg(c: canvas.Canvas, page_no: int, title: str | None = None, section: str | None = None):
    c.setFillColor(LIGHT_BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.rect(0, PAGE_H - 19 * mm, PAGE_W, 19 * mm, fill=1, stroke=0)
    if LOGO.exists():
        c.setFillColor(BRAND_DEEP)
        c.roundRect(17 * mm, PAGE_H - 17 * mm, 45 * mm, 15 * mm, 7, fill=1, stroke=0)
        c.drawImage(str(LOGO), 18 * mm, PAGE_H - 15 * mm, width=39 * mm, height=14 * mm, preserveAspectRatio=True, mask="auto")
    else:
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(BRAND_DARK)
        c.drawString(18 * mm, PAGE_H - 13 * mm, "AiFrogi")
    if section:
        pill(c, section.upper(), PAGE_W - 64 * mm, PAGE_H - 13.5 * mm, 42 * mm, 6 * mm, BRAND_DARK)
    if title:
        c.setFont("Helvetica-Bold", 15)
        c.setFillColor(INK)
        c.drawString(18 * mm, PAGE_H - 27 * mm, safe(title))
    c.setStrokeColor(LINE)
    c.line(18 * mm, 13 * mm, PAGE_W - 18 * mm, 13 * mm)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(MUTED)
    c.drawString(18 * mm, 8 * mm, "AiFrogi project guidebook - frontend, backend, security, onboarding, and operations")
    c.drawRightString(PAGE_W - 18 * mm, 8 * mm, f"Page {page_no}")


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, title: str, body: str = "", fill=CARD, stroke=LINE, accent=None):
    c.saveState()
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y, w, h, 8, fill=1, stroke=1)
    if accent:
        c.setFillColor(accent)
        c.roundRect(x, y + h - 5, w, 5, 5, fill=1, stroke=0)
    c.restoreState()
    para(c, title, x + 8, y + h - 10, w - 16, "h2")
    if body:
        para(c, body, x + 8, y + h - 32, w - 16, "small")


def bullets(c: canvas.Canvas, items: Iterable[str], x: float, y_top: float, w: float, color=BRAND_MAGENTA, leading=15):
    y = y_top
    for item in items:
        c.setFillColor(color)
        c.circle(x + 3, y - 4, 2.1, fill=1, stroke=0)
        h = para(c, item, x + 11, y + 2, w - 12, "body")
        y -= max(leading, h + 4)
    return y


@dataclass
class Node:
    id: str
    label: str
    col: int
    row: int
    fill: object = CARD
    stroke: object = LINE
    text_style: str = "box"


class Flow:
    def __init__(self, nodes: list[Node], edges: list[tuple[str, str, str | None]], cols: int, rows: int):
        self.nodes = nodes
        self.edges = edges
        self.cols = cols
        self.rows = rows

    def draw(self, c: canvas.Canvas, x: float, y: float, w: float, h: float, box_w: float = 34 * mm, box_h: float = 14 * mm):
        pos = {}
        col_gap = 0 if self.cols <= 1 else (w - box_w) / (self.cols - 1)
        row_gap = 0 if self.rows <= 1 else (h - box_h) / (self.rows - 1)
        for n in self.nodes:
            nx = x + n.col * col_gap
            ny = y + h - box_h - n.row * row_gap
            pos[n.id] = (nx, ny, box_w, box_h)

        for src, dst, label in self.edges:
            if src not in pos or dst not in pos:
                continue
            sx, sy, sw, sh = pos[src]
            dx, dy, dw, dh = pos[dst]
            start_x, start_y = sx + sw / 2, sy + sh / 2
            end_x, end_y = dx + dw / 2, dy + dh / 2
            # Start and end at box edges for cleaner line.
            if abs(end_x - start_x) > abs(end_y - start_y):
                if end_x > start_x:
                    start_x = sx + sw
                    end_x = dx
                else:
                    start_x = sx
                    end_x = dx + dw
            else:
                if end_y > start_y:
                    start_y = sy + sh
                    end_y = dy
                else:
                    start_y = sy
                    end_y = dy + dh
            arrow(c, start_x, start_y, end_x, end_y)
            if label:
                c.setFillColor(MUTED)
                c.setFont("Helvetica-Bold", 6.2)
                c.drawCentredString((start_x + end_x) / 2, (start_y + end_y) / 2 + 4, safe(label))

        for n in self.nodes:
            nx, ny, nw, nh = pos[n.id]
            c.saveState()
            c.setFillColor(n.fill)
            c.setStrokeColor(n.stroke)
            c.roundRect(nx, ny, nw, nh, 8, fill=1, stroke=1)
            c.restoreState()
            p = Paragraph(safe(n.label), STYLES[n.text_style])
            _, ph = p.wrap(nw - 8, nh - 4)
            p.drawOn(c, nx + 4, ny + (nh - ph) / 2)


def table(c: canvas.Canvas, data: list[list[str]], x: float, y_top: float, col_widths: list[float], row_heights=None):
    rows = [[Paragraph(safe(cell), STYLES["small"]) for cell in row] for row in data]
    t = Table(rows, colWidths=col_widths, rowHeights=row_heights)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    tw, th = t.wrapOn(c, sum(col_widths), 500)
    t.drawOn(c, x, y_top - th)
    return th


def cover(c: canvas.Canvas):
    c.setFillColor(BRAND_DEEP)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(BRAND_DARK)
    c.circle(PAGE_W - 50 * mm, PAGE_H - 20 * mm, 82 * mm, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#3B2C50"))
    c.circle(PAGE_W - 2 * mm, 12 * mm, 92 * mm, fill=1, stroke=0)
    if LOGO.exists():
        c.drawImage(str(LOGO), 24 * mm, PAGE_H - 42 * mm, width=62 * mm, height=22 * mm, preserveAspectRatio=True, mask="auto")
    para(c, "Full Scale Project Guidebook", 24 * mm, PAGE_H - 67 * mm, 120 * mm, "title")
    para(
        c,
        "Frontend, backend, Super Admin, onboarding, Meta/WhatsApp integration, billing, security, deployment, and operating flow.",
        24 * mm,
        PAGE_H - 91 * mm,
        122 * mm,
        "subtitle",
    )
    pill(c, "Version 2026-07-05", 24 * mm, 38 * mm, 43 * mm, 8 * mm, BRAND_MAGENTA)
    pill(c, "Operated by webtechnosys", 71 * mm, 38 * mm, 54 * mm, 8 * mm, colors.HexColor("#4C3B62"))
    pill(c, "30-day trial - not free forever", 129 * mm, 38 * mm, 62 * mm, 8 * mm, BRAND_GREEN, BRAND_DEEP)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(24 * mm, 25 * mm, "AiFrogi")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#DCD2EA"))
    c.drawString(24 * mm, 19 * mm, "WhatsApp operations with clear next actions, controlled support access, and verified covered security controls.")


def title_page(c: canvas.Canvas, page: int, title: str, subtitle: str, section: str):
    c.setFillColor(BRAND_DEEP)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#3B2C50"))
    c.roundRect(18 * mm, 20 * mm, PAGE_W - 36 * mm, PAGE_H - 40 * mm, 24, fill=1, stroke=0)
    pill(c, section.upper(), 27 * mm, PAGE_H - 40 * mm, 38 * mm, 7 * mm, BRAND_MAGENTA)
    para(c, title, 27 * mm, PAGE_H - 62 * mm, 145 * mm, "title")
    para(c, subtitle, 27 * mm, PAGE_H - 88 * mm, 125 * mm, "subtitle")
    c.setFillColor(BRAND_PINK)
    c.circle(PAGE_W - 52 * mm, 58 * mm, 28 * mm, fill=1, stroke=0)
    c.setFillColor(BRAND_GREEN)
    c.circle(PAGE_W - 76 * mm, 45 * mm, 10 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(PAGE_W - 52 * mm, 53 * mm, f"{page:02d}")


def add_cards_grid(c, cards: list[tuple[str, str, object]], x, y_top, w, h, cols=3):
    gap = 8
    card_w = (w - gap * (cols - 1)) / cols
    card_h = h
    for i, (t, b, accent) in enumerate(cards):
        cx = x + (i % cols) * (card_w + gap)
        cy = y_top - (i // cols + 1) * card_h - (i // cols) * gap
        card(c, cx, cy, card_w, card_h, t, b, accent=accent)


def make_pdf():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=landscape(A4))
    c.setTitle("AiFrogi Full Scale Project Guidebook")
    c.setAuthor("webtechnosys")
    c.setSubject("AiFrogi frontend, backend, Super Admin, onboarding, WhatsApp, billing, security, deployment, and operations guidebook")
    c.setCreator("AiFrogi guidebook generator")
    page = 1

    cover(c)
    c.showPage()
    page += 1

    page_bg(c, page, "Executive snapshot", "Overview")
    para(c, "What AiFrogi is", 18 * mm, PAGE_H - 39 * mm, 82 * mm, "h1")
    para(
        c,
        "AiFrogi helps businesses run WhatsApp conversations, broadcasts, reminders, payments, forms, reviews, retargeting, and human-assisted AI workflows through the official WhatsApp Business Platform.",
        18 * mm,
        PAGE_H - 52 * mm,
        86 * mm,
        "body",
    )
    card(c, 115 * mm, PAGE_H - 76 * mm, 72 * mm, 36 * mm, "Core promise", "Turn WhatsApp customer conversations into the right next action while keeping people, consent, billing, and data boundaries clear.", accent=BRAND_MAGENTA)
    card(c, 194 * mm, PAGE_H - 76 * mm, 76 * mm, 36 * mm, "Brand truth", "AiFrogi is the product. webtechnosys is the operating company. lead-os-ai is only a legacy technical path/process name.", accent=BRAND_BLUE)
    add_cards_grid(
        c,
        [
            ("Trial rule", "30 days only. After expiry, paid actions pause automatically while data remains preserved.", BRAND_GREEN),
            ("Meta charges", "Meta usage and AiFrogi platform fees remain separate in pricing and billing.", BRAND_AMBER),
            ("Security claim", "Use verified-for-covered-controls language. Never say fully secure or Meta endorsed.", BRAND_MAGENTA),
            ("Support access", "Customer data is not an open admin workspace. Access must be scoped, controlled, and auditable.", BRAND_BLUE),
            ("Marketing style", "Less text, more visual narration, real product screens, no fake logos.", BRAND_PINK),
            ("Operating standard", "Every major release needs build, verifiers, health checks, and honest status.", BRAND_DARK),
        ],
        18 * mm,
        PAGE_H - 94 * mm,
        PAGE_W - 36 * mm,
        31 * mm,
        cols=3,
    )
    c.showPage()
    page += 1

    page_bg(c, page, "Guidebook contents", "Map")
    contents = [
        ["Section", "What it covers"],
        ["01 System flow", "Overall system, trial vs paid, prerequisites, Meta onboarding, live operations"],
        ["02 Marketing frontend", "Homepage, solutions, resources, SEO, security confidence, case studies"],
        ["03 Customer app", "Dashboard, Inbox, campaigns, workflows, knowledge, billing, support, settings"],
        ["04 Backend", "API routes, service layer, database models, webhook and automation runtime"],
        ["05 Super Admin", "Customer health, onboarding blockers, billing risk, support, incidents, audit"],
        ["06 Security", "Tenant boundaries, OTP, support grants, Meta signature enforcement, verified claims"],
        ["07 Operations", "Deployment, health, monitoring, backup, incident response, verification scripts"],
        ["08 Roadmap", "Priority work, scaling controls, external proof, CI gate, integrations"],
    ]
    table(c, contents, 22 * mm, PAGE_H - 43 * mm, [52 * mm, 195 * mm])
    card(c, 22 * mm, 28 * mm, 247 * mm, 28 * mm, "How to use this guide", "Use this as the master operating guide. Public copy, backend behavior, security evidence, Super Admin process, and deployment runbooks should all agree with this document.", accent=BRAND_MAGENTA)
    c.showPage()
    page += 1

    title_page(c, page, "01. Complete system flow", "The full AiFrogi journey from first website visit to live WhatsApp operations, billing, security, and Super Admin control.", "Flowcharts")
    c.showPage()
    page += 1

    page_bg(c, page, "Overall system map", "Flowchart")
    flow = Flow(
        [
            Node("visitor", "Website visitor", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("site", "aifrogi.com marketing site", 1, 1, CARD),
            Node("register", "Trial or paid signup", 2, 1, CARD),
            Node("app", "app.aifrogi.com customer app", 3, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("inbox", "Inbox, campaigns, workflows, billing, support", 4, 0, CARD),
            Node("meta", "Meta WhatsApp Business Platform", 4, 2, CARD),
            Node("webhook", "Signed webhooks", 3, 3, CARD),
            Node("backend", "Next.js API + Prisma backend", 2, 3, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("db", "PostgreSQL", 1, 3, CARD),
            Node("admin", "Super Admin control center", 0, 3, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("audit", "Platform audit trail", 0, 4, CARD),
        ],
        [
            ("visitor", "site", None),
            ("site", "register", None),
            ("register", "app", None),
            ("app", "inbox", None),
            ("app", "meta", None),
            ("meta", "webhook", None),
            ("webhook", "backend", None),
            ("backend", "db", None),
            ("admin", "backend", None),
            ("admin", "audit", None),
        ],
        5,
        5,
    )
    flow.draw(c, 20 * mm, 26 * mm, PAGE_W - 40 * mm, 128 * mm, 43 * mm, 16 * mm)
    c.showPage()
    page += 1

    page_bg(c, page, "End-to-end business journey", "Flowchart")
    flow = Flow(
        [
            Node("a", "Visitor reaches website", 0, 0, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("b", "Choose path", 1, 0, BRAND_AMBER),
            Node("c", "30-day trial", 2, 0, BRAND_GREEN),
            Node("d", "Paid plan or setup", 2, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("e", "Business registration", 3, 0, CARD),
            Node("f", "Email verification", 4, 0, CARD),
            Node("g", "Owner password", 5, 0, CARD),
            Node("h", "Workspace created", 6, 0, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("i", "Prerequisites", 1, 2, CARD),
            Node("j", "Meta onboarding", 2, 2, CARD),
            Node("k", "Templates and test", 3, 2, CARD),
            Node("l", "Live operations", 4, 2, BRAND_GREEN),
            Node("m", "Analytics, billing, support, audit", 5, 2, CARD),
            Node("n", "Expired trial pauses paid actions", 6, 2, BRAND_AMBER),
        ],
        [
            ("a", "b", None),
            ("b", "c", "trial"),
            ("b", "d", "paid"),
            ("c", "e", None),
            ("d", "e", None),
            ("e", "f", None),
            ("f", "g", None),
            ("g", "h", None),
            ("h", "i", None),
            ("i", "j", None),
            ("j", "k", None),
            ("k", "l", None),
            ("l", "m", None),
            ("c", "n", "after 30 days"),
        ],
        7,
        3,
    )
    flow.draw(c, 14 * mm, 51 * mm, PAGE_W - 28 * mm, 91 * mm, 32 * mm, 14 * mm)
    card(c, 22 * mm, 22 * mm, 247 * mm, 18 * mm, "Business rule", "The customer can start as trial or paid, but both paths must pass ownership verification, prerequisites, Meta onboarding, template readiness, and first test before serious live operations.", accent=BRAND_MAGENTA)
    c.showPage()
    page += 1

    page_bg(c, page, "Trial vs paid signup", "Flowchart")
    flow = Flow(
        [
            Node("intent", "Signup intent", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("choice", "Trial or paid?", 1, 1, BRAND_AMBER),
            Node("trial", "30-day trial", 2, 0, BRAND_GREEN),
            Node("paid", "Paid plan / setup", 2, 2, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("reg", "Register + verify email", 3, 1, CARD),
            Node("workspace", "Workspace created", 4, 1, CARD),
            Node("active", "Active within limits", 5, 0, BRAND_GREEN),
            Node("expired", "Expired or unpaid", 5, 2, BRAND_AMBER),
            Node("paused", "Paid actions paused; data preserved", 6, 2, CARD),
            Node("upgrade", "Upgrade or payment confirmation", 6, 0, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
        ],
        [
            ("intent", "choice", None),
            ("choice", "trial", "trial"),
            ("choice", "paid", "paid"),
            ("trial", "reg", None),
            ("paid", "reg", None),
            ("reg", "workspace", None),
            ("workspace", "active", None),
            ("workspace", "expired", "day 31"),
            ("expired", "paused", None),
            ("paused", "upgrade", None),
            ("upgrade", "active", None),
        ],
        7,
        3,
    )
    flow.draw(c, 13 * mm, 42 * mm, PAGE_W - 26 * mm, 102 * mm, 34 * mm, 15 * mm)
    bullets(
        c,
        [
            "Trial is not free forever; it is a 30-day evaluation window.",
            "After expiry, messaging, campaigns, automation, and new team invitations are refused server-side.",
            "Customer data remains preserved so upgrade or renewal is clean.",
        ],
        28 * mm,
        34 * mm,
        230 * mm,
    )
    c.showPage()
    page += 1

    page_bg(c, page, "Prerequisites before WhatsApp API onboarding", "Flowchart")
    flow = Flow(
        [
            Node("start", "Customer wants WhatsApp API", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("biz", "Business identity ready", 1, 1, CARD),
            Node("meta", "Meta Business access", 2, 1, CARD),
            Node("sim", "SIM/mobile number accessible", 3, 1, CARD),
            Node("wa", "Number active on normal WhatsApp?", 4, 1, BRAND_AMBER),
            Node("ready", "Ready for API activation", 5, 0, BRAND_GREEN),
            Node("migrate", "Migrate or release number path", 5, 2, BRAND_AMBER),
            Node("otp", "Owner available for OTP", 6, 1, CARD),
            Node("docs", "Business validation docs ready", 7, 1, CARD),
            Node("use", "Use case, template, consent ready", 8, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
        ],
        [
            ("start", "biz", None),
            ("biz", "meta", None),
            ("meta", "sim", None),
            ("sim", "wa", None),
            ("wa", "ready", "no"),
            ("wa", "migrate", "yes"),
            ("ready", "otp", None),
            ("migrate", "otp", None),
            ("otp", "docs", None),
            ("docs", "use", None),
        ],
        9,
        3,
    )
    flow.draw(c, 10 * mm, 38 * mm, PAGE_W - 20 * mm, 110 * mm, 27 * mm, 15 * mm)
    card(c, 20 * mm, 20 * mm, 252 * mm, 20 * mm, "Customer guidance", "Do not ask for passwords, OTPs, permanent tokens, or app secrets. The customer only needs to prepare business access, number readiness, documents, consent proof, and the first practical WhatsApp use case.", accent=BRAND_GREEN)
    c.showPage()
    page += 1

    page_bg(c, page, "Meta onboarding and go-live", "Flowchart")
    flow = Flow(
        [
            Node("active", "Workspace active", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("pre", "Prerequisites complete", 1, 1, CARD),
            Node("connect", "Secure Meta connection", 2, 1, CARD),
            Node("review", "Meta review / number status", 3, 1, BRAND_AMBER),
            Node("pending", "Pending - owner: Meta", 4, 0, CARD),
            Node("action", "Action required - owner: You or AiFrogi", 4, 2, BRAND_AMBER),
            Node("sync", "Approved - sync phone health and templates", 5, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("template", "Approved template available?", 6, 1, BRAND_AMBER),
            Node("submit", "Prepare and submit template", 7, 0, CARD),
            Node("test", "Send first test message", 7, 2, CARD),
            Node("proof", "Provider accepted - go-live proof recorded", 8, 1, BRAND_GREEN),
        ],
        [
            ("active", "pre", None),
            ("pre", "connect", None),
            ("connect", "review", None),
            ("review", "pending", "pending"),
            ("review", "action", "fix"),
            ("review", "sync", "approved"),
            ("sync", "template", None),
            ("template", "submit", "no"),
            ("submit", "template", None),
            ("template", "test", "yes"),
            ("test", "proof", "200/accepted"),
        ],
        9,
        3,
    )
    flow.draw(c, 8 * mm, 39 * mm, PAGE_W - 16 * mm, 107 * mm, 27 * mm, 15 * mm)
    card(c, 24 * mm, 20 * mm, 76 * mm, 19 * mm, "Meta timing", "Meta approval timing is controlled by Meta.", accent=BRAND_AMBER)
    card(c, 108 * mm, 20 * mm, 76 * mm, 19 * mm, "After approval", "AiFrogi validation is usually 30-60 minutes when access is correct.", accent=BRAND_BLUE)
    card(c, 192 * mm, 20 * mm, 76 * mm, 19 * mm, "First workflow", "Useful workflows usually need 1-2 days for template, audience, consent, and use-case setup.", accent=BRAND_GREEN)
    c.showPage()
    page += 1

    page_bg(c, page, "Live operations loop", "Flowchart")
    flow = Flow(
        [
            Node("msg", "Customer message or campaign reply", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("inbox", "AiFrogi Inbox", 1, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("next", "Right next action?", 2, 1, BRAND_AMBER),
            Node("human", "Human reply", 3, 0, CARD),
            Node("ai", "AI suggested answer", 3, 1, CARD),
            Node("template", "Approved template", 3, 2, CARD),
            Node("payment", "Payment link", 4, 0, CARD),
            Node("forms", "Form / survey / review", 4, 1, CARD),
            Node("reminder", "Reminder / retargeting", 4, 2, CARD),
            Node("timeline", "Conversation timeline updated", 5, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("learn", "Analytics, knowledge gaps, automation learning", 6, 1, BRAND_GREEN),
        ],
        [
            ("msg", "inbox", None),
            ("inbox", "next", None),
            ("next", "human", None),
            ("next", "ai", None),
            ("next", "template", None),
            ("human", "timeline", None),
            ("ai", "timeline", None),
            ("template", "timeline", None),
            ("payment", "timeline", None),
            ("forms", "timeline", None),
            ("reminder", "timeline", None),
            ("timeline", "learn", None),
        ],
        7,
        3,
    )
    flow.draw(c, 14 * mm, 38 * mm, PAGE_W - 28 * mm, 112 * mm, 34 * mm, 15 * mm)
    card(c, 23 * mm, 19 * mm, 247 * mm, 20 * mm, "Product experience", "Broadcasts, chatbot, payments, forms, reviews, e-commerce retargeting, and reminders are not separate stories. They all return context to the same Inbox and next-action loop.", accent=BRAND_MAGENTA)
    c.showPage()
    page += 1

    page_bg(c, page, "Campaign compliance flow", "Flowchart")
    flow = Flow(
        [
            Node("obj", "Campaign objective", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("aud", "Audience segment", 1, 1, CARD),
            Node("consent", "Consent proof", 2, 1, BRAND_GREEN),
            Node("template", "Approved Meta template", 3, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("preview", "Variables, media, preview", 4, 1, CARD),
            Node("test", "Internal test", 5, 1, CARD),
            Node("confirm", "Cost ceiling and final audience diff", 6, 1, BRAND_AMBER),
            Node("send", "Send now or schedule", 7, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("guard", "Guardrails: plan, opt-out, quiet hours, frequency cap", 3, 2, BRAND_AMBER),
            Node("analytics", "Delivery, read, reply, opt-out analytics", 8, 1, BRAND_GREEN),
        ],
        [
            ("obj", "aud", None),
            ("aud", "consent", None),
            ("consent", "template", None),
            ("template", "preview", None),
            ("preview", "test", None),
            ("test", "confirm", None),
            ("confirm", "send", None),
            ("template", "guard", None),
            ("guard", "send", None),
            ("send", "analytics", None),
        ],
        9,
        3,
    )
    flow.draw(c, 8 * mm, 39 * mm, PAGE_W - 16 * mm, 108 * mm, 28 * mm, 15 * mm)
    card(c, 23 * mm, 20 * mm, 247 * mm, 19 * mm, "Compliance rule", "Unapproved templates, missing consent, opted-out recipients, expired trial, exceeded plan limits, and frequency/quiet-hour blocks must be refused by the backend, not only hidden in the UI.", accent=BRAND_GREEN)
    c.showPage()
    page += 1

    page_bg(c, page, "Automation engine flow", "Flowchart")
    flow = Flow(
        [
            Node("trigger", "Approved trigger", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("elig", "Eligibility, consent, plan", 1, 1, CARD),
            Node("quiet", "Quiet hours / frequency cap", 2, 1, BRAND_AMBER),
            Node("job", "AutomationJob with idempotency key", 3, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("claim", "Cron claims due job with lease", 4, 1, CARD),
            Node("execute", "Execute safe action", 5, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("ok", "Complete and audit", 6, 0, BRAND_GREEN),
            Node("retry", "Retry with backoff", 6, 1, BRAND_AMBER),
            Node("dead", "Dead-letter / human intervention", 6, 2, CARD),
        ],
        [
            ("trigger", "elig", None),
            ("elig", "quiet", None),
            ("quiet", "job", None),
            ("job", "claim", None),
            ("claim", "execute", None),
            ("execute", "ok", "success"),
            ("execute", "retry", "recoverable"),
            ("execute", "dead", "failed"),
            ("retry", "claim", None),
        ],
        7,
        3,
    )
    flow.draw(c, 16 * mm, 39 * mm, PAGE_W - 32 * mm, 108 * mm, 34 * mm, 15 * mm)
    card(c, 23 * mm, 20 * mm, 247 * mm, 19 * mm, "Automation principle", "Build reliability before drag-and-drop design. A visual builder should come only after jobs, leases, retries, guardrails, and audit are stable.", accent=BRAND_BLUE)
    c.showPage()
    page += 1

    page_bg(c, page, "Security and customer-data boundary flow", "Flowchart")
    flow = Flow(
        [
            Node("login", "User login", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("priv", "Privileged role?", 1, 1, BRAND_AMBER),
            Node("otp", "Email OTP required", 2, 0, BRAND_GREEN),
            Node("session", "Registered session", 3, 1, CARD),
            Node("workspace", "Workspace resolved", 4, 1, CARD),
            Node("role", "Role checked", 5, 1, CARD),
            Node("sub", "Subscription/trial state", 6, 1, BRAND_AMBER),
            Node("tenant", "Tenant boundary enforced", 7, 0, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("support", "Customer-controlled support grant", 7, 2, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("audit", "Audit and verifier evidence", 8, 1, BRAND_GREEN),
        ],
        [
            ("login", "priv", None),
            ("priv", "otp", "owner/admin"),
            ("otp", "session", None),
            ("priv", "session", "agent/viewer"),
            ("session", "workspace", None),
            ("workspace", "role", None),
            ("role", "sub", None),
            ("sub", "tenant", None),
            ("sub", "support", None),
            ("tenant", "audit", None),
            ("support", "audit", None),
        ],
        9,
        3,
    )
    flow.draw(c, 8 * mm, 39 * mm, PAGE_W - 16 * mm, 108 * mm, 28 * mm, 15 * mm)
    card(c, 23 * mm, 20 * mm, 247 * mm, 19 * mm, "Confidence message", "Customer conversations are not an open admin dashboard. AiFrogi separates workspaces, gates sensitive actions, requires OTP for privileged users, and verifies covered routes with repeatable tests.", accent=BRAND_MAGENTA)
    c.showPage()
    page += 1

    page_bg(c, page, "Backend runtime flow", "Flowchart")
    flow = Flow(
        [
            Node("req", "Browser, Meta, or Cron request", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("route", "Next.js route handler", 1, 1, CARD),
            Node("type", "Request type", 2, 1, BRAND_AMBER),
            Node("session", "Session verification", 3, 0, CARD),
            Node("sig", "Meta signature verification", 3, 1, BRAND_GREEN),
            Node("cron", "Cron bearer secret verification", 3, 2, CARD),
            Node("workspace", "Workspace/role or phone mapping", 4, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("service", "Business service layer", 5, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("repo", "Repository / Prisma", 6, 1, CARD),
            Node("db", "PostgreSQL", 7, 1, CARD),
            Node("external", "Meta, email, future payment provider", 6, 2, CARD),
            Node("audit", "Audit, metrics, health", 7, 0, BRAND_GREEN),
        ],
        [
            ("req", "route", None),
            ("route", "type", None),
            ("type", "session", "app"),
            ("type", "sig", "webhook"),
            ("type", "cron", "cron"),
            ("session", "workspace", None),
            ("sig", "workspace", None),
            ("cron", "workspace", None),
            ("workspace", "service", None),
            ("service", "repo", None),
            ("repo", "db", None),
            ("service", "external", None),
            ("service", "audit", None),
        ],
        8,
        3,
    )
    flow.draw(c, 13 * mm, 39 * mm, PAGE_W - 26 * mm, 108 * mm, 31 * mm, 15 * mm)
    c.showPage()
    page += 1

    page_bg(c, page, "Super Admin operating loop", "Flowchart")
    flow = Flow(
        [
            Node("admin", "Super Admin opens control center", 0, 1, BRAND_DARK, BRAND_DARK, "white_box"),
            Node("health", "Customer health and onboarding queue", 1, 1, CARD),
            Node("action", "What needs action?", 2, 1, BRAND_AMBER),
            Node("cust", "Customer prerequisites", 3, 0, CARD),
            Node("aif", "AiFrogi action required", 3, 1, BRAND_BLUE, BRAND_BLUE, "white_box"),
            Node("meta", "Meta approval pending", 3, 2, CARD),
            Node("bill", "Trial paused / billing risk", 4, 0, BRAND_AMBER),
            Node("incident", "Webhook, campaign, automation, support issue", 4, 2, CARD),
            Node("guide", "Guide, fix, monitor, or run incident process", 5, 1, BRAND_MAGENTA, BRAND_MAGENTA, "white_box"),
            Node("audit", "Update status and audit", 6, 1, BRAND_GREEN),
        ],
        [
            ("admin", "health", None),
            ("health", "action", None),
            ("action", "cust", None),
            ("action", "aif", None),
            ("action", "meta", None),
            ("cust", "guide", None),
            ("aif", "guide", None),
            ("meta", "guide", None),
            ("bill", "guide", None),
            ("incident", "guide", None),
            ("guide", "audit", None),
        ],
        7,
        3,
    )
    flow.draw(c, 16 * mm, 47 * mm, PAGE_W - 32 * mm, 96 * mm, 34 * mm, 15 * mm)
    card(c, 23 * mm, 19 * mm, 247 * mm, 18 * mm, "Super Admin principle", "Super Admin improves customer success by showing the right next action. It should not become unrestricted customer-data browsing.", accent=BRAND_DARK)
    c.showPage()
    page += 1

    title_page(c, page, "02. Product guide", "How the public site, customer app, backend, and Super Admin should work together.", "Guide")
    c.showPage()
    page += 1

    page_bg(c, page, "Marketing frontend guide", "Frontend")
    add_cards_grid(
        c,
        [
            ("Header nav", "Home, Solutions, Onboarding, Integration, Resources, Pricing, Login, Start free trial.", BRAND_DARK),
            ("Visual style", "Calm dark-purple brand, transparent logo, less text, product screenshots, graphical narration.", BRAND_MAGENTA),
            ("Homepage", "Benefit first. Avoid keyword stuffing. Highlight security, onboarding, pricing, case study, and mobile CTA.", BRAND_BLUE),
            ("Solutions", "Broadcast, chatbot, e-commerce retargeting, reminders, payment, forms, surveys, reviews.", BRAND_GREEN),
            ("Resources", "Use guides for SEO: API cost, onboarding checklist, consent, templates, comparisons, security.", BRAND_AMBER),
            ("Trust", "No fake logos. Use real case studies, honest Meta wording, and sample labels on illustrative data.", BRAND_PINK),
        ],
        18 * mm,
        PAGE_H - 44 * mm,
        PAGE_W - 36 * mm,
        39 * mm,
        cols=3,
    )
    card(c, 20 * mm, 26 * mm, 250 * mm, 24 * mm, "Recommended homepage line", "Turn WhatsApp chats into bookings, payments, reminders, reviews, and repeat customers.", accent=BRAND_MAGENTA)
    c.showPage()
    page += 1

    page_bg(c, page, "Customer app guide", "Frontend")
    add_cards_grid(
        c,
        [
            ("Dashboard", "Daily action queue, workspace health, WhatsApp status, billing and onboarding signals.", BRAND_BLUE),
            ("Inbox", "Queue, conversation list, chat workspace, lead intelligence, AI suggestion, human handover.", BRAND_MAGENTA),
            ("Campaigns", "Approved template, consent proof, preview, test send, cost ceiling, send/schedule, analytics.", BRAND_GREEN),
            ("Workflows", "Automation jobs, queue health, due/retry/dead-letter states, safe manual demo actions.", BRAND_AMBER),
            ("Knowledge", "Documents, approved Q&A, conflicts, gaps, review actions, approved context for AI.", BRAND_PINK),
            ("Billing", "30-day trial, plan, usage, invoices, pause state, paid plan choices, Meta fee separation.", BRAND_DARK),
            ("Support", "Tickets and customer-controlled support access grants.", BRAND_BLUE),
            ("Settings", "Integrations, team roles, active sessions, session revocation, security controls.", BRAND_GREEN),
            ("Onboarding", "Prerequisites, owner labels, Meta status, templates, first test message, go-live proof.", BRAND_MAGENTA),
        ],
        18 * mm,
        PAGE_H - 44 * mm,
        PAGE_W - 36 * mm,
        33 * mm,
        cols=3,
    )
    c.showPage()
    page += 1

    page_bg(c, page, "Backend and API guide", "Backend")
    data = [
        ["Layer", "Responsibility"],
        ["app/api/auth", "Login, logout, registration, invitation, active sessions"],
        ["app/api/integrations/whatsapp", "Settings, validate, test, operator/template/bulk messages, webhooks"],
        ["app/api/campaigns", "Campaign runs, test contacts, scheduled campaign updates"],
        ["app/api/automation", "Job queue, protected cron runner"],
        ["app/api/knowledge", "Knowledge settings, entries, documents, gaps"],
        ["app/api/onboarding", "Onboarding profile, documents, Meta connect/status"],
        ["app/api/support", "Tickets and customer-controlled support access"],
        ["app/api/admin", "Super Admin customer and billing actions"],
        ["lib/services", "Business logic for WhatsApp, leads, knowledge, onboarding, assets, dashboard"],
        ["lib/repositories", "Database access boundary for domain objects"],
    ]
    table(c, data, 18 * mm, PAGE_H - 42 * mm, [70 * mm, 190 * mm])
    c.showPage()
    page += 1

    page_bg(c, page, "Database model map", "Backend")
    data = [
        ["Domain", "Primary models"],
        ["Customer account", "Organization, Property, OrganizationMember, UserSession"],
        ["Onboarding", "OnboardingProfile, OnboardingCredential, OnboardingDocument, OnboardingActivity"],
        ["WhatsApp and leads", "WhatsAppIntegration, WhatsAppBotConfiguration, Lead, LeadMessage, LeadTag"],
        ["Campaigns", "Campaign, CampaignRecipient"],
        ["Automation", "AutomationJob"],
        ["Knowledge", "KnowledgeDocument, KnowledgeEntry, KnowledgeGap"],
        ["Billing and operations", "BillingPlan, Subscription, BillingInvoice, UsageRecord, PlatformIncident, PlatformAuditLog"],
        ["Support and assets", "SupportTicket, SupportTicketMessage, Asset, LeadAssetShare"],
        ["Metrics", "MetricDaily"],
    ]
    table(c, data, 18 * mm, PAGE_H - 42 * mm, [66 * mm, 194 * mm])
    card(c, 20 * mm, 24 * mm, 250 * mm, 22 * mm, "Database principle", "New features should preserve tenant boundaries and use repositories/services instead of scattering direct database writes across UI components.", accent=BRAND_BLUE)
    c.showPage()
    page += 1

    page_bg(c, page, "Billing, trial, and entitlement rules", "Commercial")
    add_cards_grid(
        c,
        [
            ("Trial", "30 days only. Not free forever.", BRAND_GREEN),
            ("Pause", "After trial expiry, paid actions pause automatically.", BRAND_AMBER),
            ("Preserve", "Data remains preserved for upgrade/recovery.", BRAND_BLUE),
            ("Block", "Messaging, campaigns, automation, and new team invites are refused server-side.", BRAND_MAGENTA),
            ("Separate fees", "AiFrogi platform fee, Meta charges, AI overage, services, taxes, adjustments.", BRAND_DARK),
            ("Manual first", "Manual invoices/payment references now. Razorpay later through idempotent webhooks.", BRAND_PINK),
        ],
        18 * mm,
        PAGE_H - 44 * mm,
        PAGE_W - 36 * mm,
        39 * mm,
        cols=3,
    )
    card(c, 20 * mm, 27 * mm, 250 * mm, 24 * mm, "Customer wording", "Your trial runs for 30 days. If it expires before upgrade, paid actions pause automatically, but your workspace data remains preserved.", accent=BRAND_GREEN)
    c.showPage()
    page += 1

    page_bg(c, page, "Security posture and public wording", "Security")
    card(c, 18 * mm, PAGE_H - 71 * mm, 252 * mm, 38 * mm, "Allowed public claim", "AiFrogi enforces customer-controlled support access, tenant isolation, role-gated sensitive actions, privileged login OTP, and fail-closed Meta webhook security on the covered routes, verified by repeatable tests.", accent=BRAND_MAGENTA)
    add_cards_grid(
        c,
        [
            ("Do say", "Workspace-scoped data, role-gated sensitive actions, support access controlled and auditable.", BRAND_GREEN),
            ("Do not say", "Fully secure, bank-grade, Meta endorsed, or impossible for anyone to access data.", BRAND_AMBER),
            ("Meta wording", "Meta access verified for webtechnosys. Avoid endorsement-style badge copy.", BRAND_BLUE),
            ("Customer warning", "Never share Facebook password, email password, OTP, permanent token, or app secret.", BRAND_PINK),
            ("Evidence boundary", "Say covered routes/covered controls. That is honest and stronger than vague claims.", BRAND_DARK),
            ("Next security work", "CI gate, route coverage expansion, rate-limit audit, restore drill, external assessment later.", BRAND_MAGENTA),
        ],
        18 * mm,
        PAGE_H - 89 * mm,
        PAGE_W - 36 * mm,
        35 * mm,
        cols=3,
    )
    c.showPage()
    page += 1

    page_bg(c, page, "Deployment and verification guide", "Operations")
    data = [
        ["Item", "Value or command"],
        ["Production VPS", "root@187.77.188.146"],
        ["Production path", "/var/www/lead-os-ai"],
        ["PM2 app", "lead-os-ai"],
        ["Port", "3011"],
        ["Build", "npm run build"],
        ["Prisma", "npm run db:generate; npx prisma db push"],
        ["Client secret scan", "npm run verify:client-secrets"],
        ["Security boundaries", "npm run verify:security-boundaries:fixtures"],
        ["Restart", "AIFROGI_RELEASE=<sha> pm2 restart lead-os-ai --update-env; pm2 save"],
        ["Health", "https://app.aifrogi.com/api/health/ready"],
    ]
    table(c, data, 18 * mm, PAGE_H - 42 * mm, [62 * mm, 198 * mm])
    card(c, 20 * mm, 24 * mm, 250 * mm, 22 * mm, "Deployment rule", "The production directory is not a normal Git checkout. Do not assume git pull on the server deploys changes.", accent=BRAND_AMBER)
    c.showPage()
    page += 1

    page_bg(c, page, "Monitoring, backup, and incident response", "Operations")
    add_cards_grid(
        c,
        [
            ("Health", "Monitor /api/health/live and /api/health/ready.", BRAND_GREEN),
            ("PM2/Nginx", "Watch restart count, 5xx rate, certificate expiry.", BRAND_BLUE),
            ("Database", "Watch PostgreSQL storage, connections, and backup freshness.", BRAND_MAGENTA),
            ("WhatsApp", "Watch webhook age, failed message events, template errors.", BRAND_PINK),
            ("Automation", "Watch retry/dead-letter jobs and cron runner output.", BRAND_AMBER),
            ("Backup", "Encrypted daily backup, off-VPS replication, monthly restore drill.", BRAND_DARK),
            ("Incidents", "Protect data first, assign owner, communicate known impact only.", BRAND_GREEN),
            ("Recovery", "Verify health after fix/rollback before declaring recovered.", BRAND_BLUE),
            ("Evidence", "Record restore drills, incidents, and remediation notes.", BRAND_MAGENTA),
        ],
        18 * mm,
        PAGE_H - 44 * mm,
        PAGE_W - 36 * mm,
        33 * mm,
        cols=3,
    )
    c.showPage()
    page += 1

    page_bg(c, page, "SEO, resources, and trust content", "Growth")
    add_cards_grid(
        c,
        [
            ("Homepage", "Brand and conversion page. Avoid keyword stuffing.", BRAND_DARK),
            ("Resources", "Rank with useful buyer guides and onboarding/cost education.", BRAND_GREEN),
            ("Comparisons", "AiFrogi vs alternatives, written fairly and without fake claims.", BRAND_BLUE),
            ("India/UAE cost", "Explain Meta usage plus AiFrogi platform fee clearly.", BRAND_MAGENTA),
            ("Security guide", "Explain data boundary, support access, OTP, webhook signatures in plain English.", BRAND_PINK),
            ("Case studies", "Use real approval and evidence. Do not pretend related proof is independent.", BRAND_AMBER),
        ],
        18 * mm,
        PAGE_H - 44 * mm,
        PAGE_W - 36 * mm,
        39 * mm,
        cols=3,
    )
    card(c, 20 * mm, 27 * mm, 250 * mm, 24 * mm, "SEO strategy", "Let resources and comparison pages carry search demand. Let the homepage carry clarity, confidence, and conversion.", accent=BRAND_GREEN)
    c.showPage()
    page += 1

    page_bg(c, page, "Operating checklist", "Runbook")
    data = [
        ["Frequency", "Checklist"],
        ["Daily", "Ready health, PM2 status, onboarding blockers, failed sends, automation dead letters, support tickets, trial expiry."],
        ["Weekly", "Campaign delivery, opt-outs, onboarding drop-off, invoices, audit logs, pricing/trial copy, homepage animation/source."],
        ["Monthly", "Backup restore drill, deferred security review, integration requests, resource updates, testimonials, plan allowances."],
        ["Before release", "Typecheck, build, relevant verifier scripts, client-secret scan, health check, public page verification."],
        ["Before paid acquisition", "Manual browser journey, external alert webhook, off-VPS backup, restore drill, pricing clarity."],
    ]
    table(c, data, 22 * mm, PAGE_H - 42 * mm, [48 * mm, 205 * mm])
    c.showPage()
    page += 1

    page_bg(c, page, "Priority roadmap", "Roadmap")
    add_cards_grid(
        c,
        [
            ("1. CI security gate", "Make verifiers required before sensitive code merges.", BRAND_MAGENTA),
            ("2. External alerts", "Configure alert webhook and off-VPS backup replication.", BRAND_GREEN),
            ("3. Restore drill", "Record first production backup restore evidence.", BRAND_BLUE),
            ("4. Proof", "Collect unrelated testimonials and approved case studies.", BRAND_AMBER),
            ("5. Integrations", "Productize common integrations and reduce custom friction.", BRAND_PINK),
            ("6. Razorpay", "Add checkout/webhook reconciliation after pricing stabilizes.", BRAND_DARK),
            ("7. Support reasons", "Improve support access reason quality and display.", BRAND_GREEN),
            ("8. Forced logout", "Add Super Admin platform-wide forced logout.", BRAND_BLUE),
            ("9. External audit", "Pen test and SOC2/ISO readiness when enterprise demand justifies it.", BRAND_MAGENTA),
        ],
        18 * mm,
        PAGE_H - 44 * mm,
        PAGE_W - 36 * mm,
        33 * mm,
        cols=3,
    )
    c.showPage()
    page += 1

    page_bg(c, page, "Glossary", "Reference")
    data = [
        ["Term", "Meaning"],
        ["AiFrogi", "Customer-facing product name"],
        ["webtechnosys", "Company/operator behind AiFrogi"],
        ["lead-os-ai", "Legacy/internal technical path and PM2 process name"],
        ["Workspace", "Customer business workspace, currently tied to Property"],
        ["Organization", "Customer account/company"],
        ["Super Admin", "AiFrogi platform operator"],
        ["WABA", "WhatsApp Business Account"],
        ["Template", "Meta-approved outbound message format"],
        ["Service window", "WhatsApp 24-hour customer-care reply window"],
        ["Campaign", "Broadcast/template send to a consented audience"],
        ["AutomationJob", "Durable backend job for scheduled or automated work"],
        ["Support grant", "Customer-controlled permission for scoped AiFrogi support access"],
        ["Covered routes", "API paths included in repeatable security verification"],
    ]
    table(c, data, 22 * mm, PAGE_H - 42 * mm, [58 * mm, 195 * mm])
    c.showPage()
    page += 1

    c.setFillColor(BRAND_DEEP)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    if LOGO.exists():
        c.drawImage(str(LOGO), 24 * mm, PAGE_H - 45 * mm, width=62 * mm, height=22 * mm, preserveAspectRatio=True, mask="auto")
    para(c, "The project is strongest when the product promise, backend behavior, public wording, and verification evidence all say the same thing.", 24 * mm, PAGE_H - 75 * mm, 170 * mm, "title")
    para(c, "Editable source: docs/aifrogi-full-project-guidebook.md", 24 * mm, 46 * mm, 150 * mm, "subtitle")
    para(c, "PDF output: output/pdf/aifrogi-full-scale-guidebook.pdf", 24 * mm, 35 * mm, 150 * mm, "subtitle")
    c.setFillColor(BRAND_MAGENTA)
    c.circle(PAGE_W - 49 * mm, 52 * mm, 28 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(PAGE_W - 49 * mm, 48 * mm, "Done")
    c.showPage()

    c.save()


if __name__ == "__main__":
    make_pdf()
    print(OUT)
