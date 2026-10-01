"use client";

import { safeAnswerUrl, type WebsiteAnswerAction } from "@/lib/website-answer-presentation";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ClinicDemoJourney } from './clinic-demo-journey';
import { HospitalityDemoJourney } from './hospitality-demo-journey';
import { PersonaDemoJourney } from './persona-demo-journey';
import { EducationDemoJourney } from './education-demo-journey';
import { guidedPersonas } from '@/lib/demo-sandbox/guided-personas';
import { WebtechnosysNavigation } from './webtechnosys-navigation';
import { WEBTECHNOSYS_BOT_SLUG } from '@/lib/webtechnosys-navigation';
import { Headset, Home, CircleHelp, Bell, LayoutGrid, MessageCircle, ArrowUp, Info, ChevronLeft, ChevronRight, X } from 'lucide-react';
import shell from './webtechnosys-shell.module.css';
import portal from './bot-portal.module.css';
import hotel from './hotel-guest-shell.module.css';
import type { WidgetMenuConfig, WidgetMenuItem } from '@/lib/widget-menu';
import { BookingSearchCard } from './booking-search-card';
import type { ShowcaseItem } from '@/lib/repositories/knowledge-repository';
import { VoiceIntakeControl } from './voice-intake-control';
import { EmojiPicker } from './emoji-picker';
import type { ConfirmedVoiceInput } from '@/lib/hotelgpt-voice-intake';

type SmartContent = { flowId:string; journey:"PRE_STAY"|"IN_STAY"; kind:string; statusLabel?:string; quickReplies?:string[] };
type Message = { role: "visitor" | "bot" | "human"; text: string; replyId?: string; senderLabel?:string; sentAt?:string; evidenceId?: string | null; feedback?: boolean | null; feedbackNotice?: string; chooseFeedbackReason?: boolean; smartContent?:SmartContent; answerActions?: WebsiteAnswerAction[]; retryText?:string };
type Qualification = { contactEligible: boolean; nextField: string | null };

const negativeReasons = ["Incorrect information", "Did not answer my question", "Outdated information", "Difficult to understand", "Needed a person"];
const webtechnosysSuggestions = ["What services do you offer?", "What training do you provide?", "Do you develop mobile apps?", "How do projects begin?"];

function RichMessageText({ text }: { text: string }) {
  return <>{text.split(/(https:\/\/[^\s]+)/g).map((part, index) => /^https:\/\//.test(part)
    ? <a key={`${part}-${index}`} href={part.replace(/[.,;!?]+$/, "")} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-2">{part}</a>
    : part)}</>;
}

function SafeBotLogo({ src, fallback, className = "" }: { src: string; fallback: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed
    ? <img src={src} alt="" className={className} onError={() => setFailed(true)} />
    : <strong aria-hidden="true">{fallback}</strong>;
}

function ShowcaseCarousel({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const item = items[Math.min(active, items.length - 1)];
  const move = (offset: number) => setActive(current => (current + offset + items.length) % items.length);
  return <article aria-label="Business showcase" className="mb-3 overflow-hidden rounded-2xl border border-[var(--widget-line)] bg-[var(--widget-surface)]"><div className="relative"><img src={item.imageUrl} alt={item.title || "Business showcase"} className="h-40 w-full object-cover" />{items.length > 1 ? <><button type="button" aria-label="Previous showcase slide" onClick={() => move(-1)} className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white"><ChevronLeft size={17} /></button><button type="button" aria-label="Next showcase slide" onClick={() => move(1)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white"><ChevronRight size={17} /></button></> : null}</div><div className="p-4">{item.title ? <h2 className="text-sm font-semibold text-[var(--widget-ink)]">{item.title}</h2> : null}{item.text ? <p className="mt-1 text-xs leading-5 text-[var(--widget-muted)]">{item.text}</p> : null}{item.linkUrl ? <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "var(--widget-accent)", color: "var(--widget-accent-text)" }}>{item.linkLabel || "Learn more"}</a> : null}{items.length > 1 ? <div className="mt-3 flex justify-center gap-1.5" aria-label={`Slide ${active + 1} of ${items.length}`}>{items.map((slide, index) => <button key={slide.id} type="button" aria-label={`Show slide ${index + 1}`} onClick={() => setActive(index)} className="h-1.5 rounded-full" style={{ width: index === active ? 18 : 6, backgroundColor: index === active ? "var(--widget-accent)" : "var(--widget-line)" }} />)}</div> : null}</div></article>;
}

export function WebsiteBotEmbed({ slug, demo = false, botName = "AI Business Assistant", welcomeMessage = "Hello. How can I help with your business enquiry today?", themeColor = "#8a6a16", widgetTheme = "dark", logoUrl = "", welcomeCardImageUrl = "", welcomeCardTitle = "", welcomeCardText = "", showcaseItems = [], dismissible = false, menu = { enabled: false, heading: "", items: [] }, stayAccessToken = "", residentMode = false, journeyMode }: { slug: string; demo?: boolean; botName?: string; welcomeMessage?: string; themeColor?: string; widgetTheme?: "dark" | "light" | "system"; logoUrl?: string; welcomeCardImageUrl?: string; welcomeCardTitle?: string; welcomeCardText?: string; showcaseItems?: ShowcaseItem[]; dismissible?: boolean; menu?: WidgetMenuConfig; stayAccessToken?: string; residentMode?: boolean; journeyMode?: "pre-stay" }) {
  const [guidedClinic,setGuidedClinic]=useState(slug==='showcase-clinicgpt');
  const [guidedPersona,setGuidedPersona]=useState(Boolean(guidedPersonas[slug]));
  const [guidedHospitality,setGuidedHospitality]=useState(['showcase-hotelgpt','showcase-dinegpt'].includes(slug));
  const accent = /^#[0-9a-f]{6}$/i.test(themeColor) ? themeColor : "#8a6a16";
  const rgb = [1, 3, 5].map((offset) => parseInt(accent.slice(offset, offset + 2), 16) / 255).map((c) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const accentText = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) > 0.179 ? "#000000" : "#ffffff";
  const [messages, setMessages] = useState<Message[]>([{ role: "bot", text: welcomeMessage }]);
  const [text, setText] = useState("");
  const [confirmedVoice, setConfirmedVoice] = useState<ConfirmedVoiceInput | null>(null);
  const [waiting, setWaiting] = useState(false);
  const isWebtechnosys = [WEBTECHNOSYS_BOT_SLUG,"webtechnosys-fresh-ai-bot-03e89f"].includes(slug) && !demo;
  const hotelJourney = residentMode ? "in-stay" : journeyMode;
  const isHotelGuest = Boolean(hotelJourney);
  // Restore the original direct chat/menu journey; keep compact mobile controls.
  const portalEnabled = isWebtechnosys;
  const [portalView, setPortalView] = useState<"home" | "messages" | "help" | "updates" | "chat">("home");
  const [menuOpen, setMenuOpen] = useState(menu.enabled);
  const [welcomePending, setWelcomePending] = useState(false);
  const welcomedSession = useRef("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(true);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  useEffect(() => { if (portalEnabled && portalView === "chat" && !mobileViewport) composerRef.current?.focus(); }, [portalEnabled, portalView, mobileViewport]);
  const [menuRevision, setMenuRevision] = useState(0);
  const [bookingItem, setBookingItem] = useState<WidgetMenuItem | null>(null);
  const [bookingDestination, setBookingDestination] = useState("");
  const [bookingContext, setBookingContext] = useState<{checkIn?:string;checkOut?:string;stay?:string}>({});
  const [humanHelpDraft, setHumanHelpDraft] = useState(false);
  const composerRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID().replaceAll("-", ""));
  const [visitorToken, setVisitorToken] = useState("");
  const [conversationState, setConversationState] = useState("AI_READY");
  const [handoffAvailable, setHandoffAvailable] = useState<boolean | null>(null);
  const [qualification, setQualification] = useState<Qualification | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [contactConsent, setContactConsent] = useState(false);
  const receivedReplies = useRef(new Set<string>());
  const replyCursor = useRef("");
  const replyCursorId = useRef("");
  const [restored, setRestored] = useState(false);
  // A browser can serve many hotel guests over time. Never restore one room's
  // transcript into another approved stay merely because the property slug is
  // the same. The signed stay capability supplies an opaque per-stay suffix.
  const storageKey = residentMode && stayAccessToken
    ? `aifrogi-resident:${slug}:${stayAccessToken.slice(-24)}`
    : journeyMode === "pre-stay"
      ? `aifrogi-prestay:${slug}`
      : `aifrogi-visitor:${slug}`;
  const transcriptRef = useRef<HTMLElement | null>(null);
  const acknowledgedReplies = useRef(new Set<string>());
  useEffect(() => {
    if (demo) return;
    const sync = () => {
      if (window.parent !== window) return;
      setMobileViewport(window.matchMedia("(max-width: 640px)").matches);
      const viewport = window.visualViewport;
      const height = viewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--bot-visible-height", `${height}px`);
      setKeyboardOpen(Boolean(viewport && viewport.scale <= 1 && window.innerHeight - height > 120));
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || window.parent === window) return;
      let hostOrigin = "";
      try { hostOrigin = new URL(document.referrer).origin; } catch { return; }
      if (event.origin !== hostOrigin || event.data?.type !== "AIFROGI_WIDGET_VIEWPORT" || event.data.slug !== slug || typeof event.data.keyboardOpen !== "boolean") return;
      setKeyboardOpen(event.data.keyboardOpen);
      if (typeof event.data.mobileViewport === "boolean") setMobileViewport(event.data.mobileViewport);
    };
    sync();
    window.visualViewport?.addEventListener("resize", sync);
    window.visualViewport?.addEventListener("scroll", sync);
    window.addEventListener("message", receive);
    return () => {
      window.visualViewport?.removeEventListener("resize", sync);
      window.visualViewport?.removeEventListener("scroll", sync);
      window.removeEventListener("message", receive);
      document.documentElement.style.removeProperty("--bot-visible-height");
    };
  }, [demo, slug]);
  useEffect(() => {
    if (demo || (portalEnabled && portalView !== "chat") || !mobileViewport) return;
    const transcript = transcriptRef.current;
    const frame = window.requestAnimationFrame(() => transcript?.scrollTo({ top: transcript.scrollHeight, behavior: "instant" }));
    return () => window.cancelAnimationFrame(frame);
  }, [demo, portalEnabled, portalView, mobileViewport, keyboardOpen, messages.length, waiting]);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (saved?.sessionId && saved?.visitorToken) {
        setSessionId(saved.sessionId); setVisitorToken(saved.visitorToken);
        setConversationState("RECONNECTING");
        if (Array.isArray(saved.messages)) {
          const restoredMessages = saved.messages.filter((m: Message) => m && ["visitor", "bot", "human"].includes(m.role) && typeof m.text === "string").slice(-200);
          setMessages(restoredMessages);
          restoredMessages.forEach((m: Message) => { if (m.replyId) receivedReplies.current.add(m.replyId); });
        }
      }
    } catch { /* Storage may be blocked in third-party embeds. */ }
    setRestored(true);
  }, [storageKey]);
  useEffect(() => {
    if (!portalEnabled || portalView !== "chat" || !restored) return;
    if (visitorToken || messages.length !== 1 || messages[0]?.text !== welcomeMessage) {
      welcomedSession.current = sessionId;
      setWelcomePending(false);
      return;
    }
    if (welcomedSession.current === sessionId) return;
    welcomedSession.current = sessionId;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setWelcomePending(true);
    const timer = window.setTimeout(() => setWelcomePending(false), 650);
    return () => { window.clearTimeout(timer); setWelcomePending(false); };
  }, [portalEnabled, portalView, restored, visitorToken, sessionId, messages, welcomeMessage]);

  useEffect(() => {
    if (!restored || !visitorToken) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ sessionId, visitorToken, messages: messages.slice(-200) })); } catch { /* In-memory chat still works. */ }
  }, [storageKey, sessionId, visitorToken, restored, messages]);

  useEffect(() => {
    if (!visitorToken || !transcriptRef.current) return;
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== "visible") return;
      const ids = entries.filter(e => e.isIntersecting).map(e => (e.target as HTMLElement).dataset.replyId!).filter(id => id && !acknowledgedReplies.current.has(id));
      if (!ids.length) return;
      ids.forEach(id => acknowledgedReplies.current.add(id));
      void fetch(`/api/public/website-bot/${encodeURIComponent(slug)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${visitorToken}` }, body: JSON.stringify({ messageIds: ids }) }).then(r => { if (!r.ok) ids.forEach(id => acknowledgedReplies.current.delete(id)); }).catch(() => ids.forEach(id => acknowledgedReplies.current.delete(id)));
    }, { root: transcriptRef.current, threshold: 0.5 });
    transcriptRef.current.querySelectorAll("[data-reply-id]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [messages, slug, visitorToken, portalView]);

  useEffect(() => {
    if (!visitorToken || conversationState === "CLOSED") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const response = await fetch(`/api/public/website-bot/${encodeURIComponent(slug)}${replyCursor.current ? `?after=${encodeURIComponent(replyCursor.current)}&afterId=${encodeURIComponent(replyCursorId.current)}` : ""}`, { headers: { Authorization: `Bearer ${visitorToken}` }, signal: controller.signal });
        const payload = await response.json();
        if (cancelled) return;
        if (response.ok) {
          const replies = (payload.messages || []) as Array<{ id: string; body: string; sentAt: string; senderLabel?:string }>;
          const fresh = replies.filter((item) => !receivedReplies.current.has(item.id));
          fresh.forEach((item) => receivedReplies.current.add(item.id));
          if (fresh.length) setMessages((current) => [...current, ...fresh.map((item): Message => { const sender=item.senderLabel||(residentMode?"Front desk":"Business team");const cleanBody=item.body.replace(/^(?:front desk\s*(?:update)?\s*:\s*)+/i,"");const time=new Date(item.sentAt).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});return { role:"human",replyId:item.id,senderLabel:sender,sentAt:item.sentAt,text:`${sender} · ${time}\n${cleanBody}` }; })]);
          if (replies.length) { replyCursor.current = replies[replies.length - 1].sentAt; replyCursorId.current = replies[replies.length - 1].id; }
          // Append final replies before reflecting closure in the composer.
          if (payload.conversationState && !(payload.conversationState === "CLOSED" && payload.hasMore)) setConversationState(payload.conversationState);
        } else if ([401, 410].includes(response.status)) setConversationState("CLOSED");
      } catch { /* Retain messages and retry a transient polling failure. */ }
      if (!cancelled) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [slug, visitorToken, conversationState, residentMode]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const contactReady = canShareContact && (humanHelpDraft || !text.trim());
    const message = text.trim() || (contactReady ? "I consent to a business follow-up about this enquiry." : "");
    if (!restored || !message || waiting || ["CLOSED", "RECONNECTING"].includes(conversationState)) return;
    setMenuOpen(false);
    const voiceInput = confirmedVoice?.transcript === message ? confirmedVoice : null;
    setText(""); setConfirmedVoice(null); setWaiting(true); setMessages((current) => [...current, { role: "visitor", text: message }]);
    try {
    const visitorTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await fetch(`/api/public/website-bot/${encodeURIComponent(slug)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, sessionId, visitorToken: visitorToken || undefined, visitorTimeZone, ...(voiceInput ? { voiceInput } : {}), ...(residentMode ? { stayAccessToken } : {}), ...(contactReady ? { name: contactName.trim(), contact: contactValue.trim(), consent: true, requestHuman: true } : {}) }) });
    const payload = await response.json().catch(() => null) as { answer?: string; error?: string; visitorToken?: string; answerEvidenceId?: string | null; conversationState?: string; handoffAvailable?: boolean; qualification?: Qualification | null; messageAccepted?: boolean; uiAction?: "OPEN_BOOKING"; bookingContext?: { destination?: string; checkIn?:string; checkOut?:string; stay?:string }; smartContent?:SmartContent; answerActions?: WebsiteAnswerAction[]; sources?:Array<{url?:string;title?:string}> } | null;
    if (payload?.visitorToken) setVisitorToken(payload.visitorToken);
    if (payload?.conversationState) setConversationState(payload.conversationState);
    if (typeof payload?.handoffAvailable === "boolean") setHandoffAvailable(payload.handoffAvailable);
    if (response.ok && payload && "qualification" in payload) setQualification(payload.qualification || null);
    if (response.ok && payload?.uiAction === "OPEN_BOOKING") {
      const approvedBooking = menu.items.find((item) => item.action === "BOOKING");
      if (approvedBooking) { setBookingDestination(payload.bookingContext?.destination || ""); setBookingContext(payload.bookingContext || {}); setBookingItem(approvedBooking); setMenuOpen(true); }
    }
    if (!(response.ok && payload?.messageAccepted)) {
      const sourceActions=(payload?.sources||[]).flatMap(source=>source.url&&safeAnswerUrl(source.url)?[{label:source.title||"View source",url:source.url}]:[]);
      const answerActions=[...(payload?.answerActions||[]),...sourceActions].filter((action,index,all)=>all.findIndex(candidate=>candidate.url===action.url)===index).slice(0,3);
      setMessages((current) => [...current, { role: "bot", text: response.ok ? payload?.answer || "I could not prepare an answer." : payload?.error || "The bot is temporarily unavailable.", evidenceId: response.ok ? payload?.answerEvidenceId : null, smartContent:response.ok?payload?.smartContent:undefined, answerActions:response.ok?answerActions:undefined, retryText:response.ok?undefined:message }]);
    }
    } catch { setMessages((current) => [...current, { role: "bot", text: "Connection interrupted. Please try again.", retryText:message }]); }
    finally { setWaiting(false); setHumanHelpDraft(false); }
  }

  async function submitFeedback(index: number, helpful: boolean, reason?: string) {
    const message = messages[index];
    if (!message?.evidenceId || !visitorToken || message.feedback !== undefined) return;
    setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, feedback: helpful, chooseFeedbackReason: false, feedbackNotice: "Saving feedback…" } : item));
    const response = await fetch(`/api/public/website-bot/${encodeURIComponent(slug)}/feedback`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${visitorToken}` }, body: JSON.stringify({ evidenceId: message.evidenceId, helpful, reason }) });
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, feedback: response.ok ? helpful : undefined, feedbackNotice: response.ok ? payload?.message || "Feedback saved." : payload?.error || "Could not save feedback." } : item));
  }

  function openChat() { setPortalView("chat"); setBookingItem(null); setBookingDestination(""); setBookingContext({}); setMenuOpen(false); }
  function openFlow(message: string) { setPortalView("chat"); setMenuOpen(false); setText(message); if (!mobileViewport) window.setTimeout(() => composerRef.current?.focus(), 0); }
  function prepareHumanHelp() {
    openChat();
    if (["HUMAN_JOINED", "HUMAN_REQUESTED"].includes(conversationState)) return;
    const request = "I would like to speak to a human.";
    setText(current => current.includes(request) ? current : `${request}${current.trim() ? ` ${current}` : ""}`);
    setHumanHelpDraft(true);
  }
  const helpDisabled = handoffAvailable === false || ["CLOSED", "RECONNECTING"].includes(conversationState) || waiting;
  const contactDigits = contactValue.replace(/\D/g, "");
  const canShareContact = qualification?.nextField === "contact" && contactConsent && contactName.trim().length >= 2 && contactDigits.length >= 7 && contactDigits.length <= 15;
  function dismissWidget() {
    composerRef.current?.blur();
    setMobileInfoOpen(false);
    window.dispatchEvent(new Event("aifrogi:widget-close"));
    // The embed and its host normally have different origins. The message contains
    if (window.parent !== window) window.parent.postMessage({ type: "AIFROGI_WIDGET_CLOSE", slug }, "*");
  }
  function startNewAiConversation() {
    try { sessionStorage.removeItem(storageKey); } catch { /* A fresh in-memory session still works. */ }
    setPortalView("chat");
    setSessionId(crypto.randomUUID().replaceAll("-", ""));
    setVisitorToken("");
    setConversationState("AI_READY");
    setMessages([{ role: "bot", text: welcomeMessage }]);
    setText("");
    setConfirmedVoice(null);
    setHumanHelpDraft(false);
    setQualification(null);
    setContactName("");
    setContactValue("");
    setContactConsent(false);
    receivedReplies.current.clear();
    acknowledgedReplies.current.clear();
    replyCursor.current = "";
    replyCursorId.current = "";
    if (!mobileViewport) window.setTimeout(() => composerRef.current?.focus(), 0);
  }
  const liveStatus = conversationState === "RECONNECTING" ? "Reconnecting…" : conversationState === "CLOSED" ? "Conversation closed" : conversationState === "HUMAN_JOINED" ? (residentMode ? "Front desk replying" : "Business team replying · AI paused") : conversationState === "HUMAN_REQUESTED" ? (residentMode ? "Request sent · Awaiting front desk update" : "Human help requested · Awaiting reply") : handoffAvailable === false ? "Human help currently unavailable" : null;

  if(guidedClinic&&slug==='showcase-clinicgpt') return <ClinicDemoJourney onChat={()=>setGuidedClinic(false)}/>;
  if(slug==='showcase-edugpt')return <EducationDemoJourney/>;
  if(guidedPersona&&guidedPersonas[slug])return <PersonaDemoJourney slug={slug} onChat={()=>setGuidedPersona(false)}/>;
  if(guidedHospitality&&['showcase-hotelgpt','showcase-dinegpt'].includes(slug)) return <HospitalityDemoJourney mode={slug==='showcase-hotelgpt'?'hotel':'dine'} onChat={()=>setGuidedHospitality(false)}/>;
  const themeClass = isHotelGuest ? "" : widgetTheme === "light" ? shell.themeLight : widgetTheme === "system" ? shell.themeSystem : shell.themeDark;
  const widgetColors = { "--widget-accent": accent, "--widget-accent-text": accentText, ...(isWebtechnosys ? {} : { borderColor: accent }) } as CSSProperties;
  return <main data-mobile={mobileViewport || undefined} data-mobile-chat={!demo && (!portalEnabled || portalView === "chat") && !menuOpen && !bookingItem || undefined} data-keyboard-open={keyboardOpen || undefined} data-bot-portal={portalEnabled || undefined} data-launcher={dismissible || undefined} data-widget-theme={widgetTheme} data-journey={hotelJourney} className={`${!demo ? portal.root : ""} ${isWebtechnosys ? shell.shell : isHotelGuest ? hotel.shell : "flex h-dvh min-h-0 flex-col overflow-hidden rounded-[22px] border bg-[#101010] text-white max-[520px]:rounded-none"} ${themeClass}`} style={widgetColors}>
    {guidedPersonas[slug]&&<button className="px-5 py-3 text-left text-sm" style={{background:'#e8c866',color:'#111'}} onClick={()=>setGuidedPersona(true)}>Start guided demo →</button>}
    {['showcase-hotelgpt','showcase-dinegpt'].includes(slug)&&<button className="px-5 py-3 text-left text-sm" style={{background:'#e8c866',color:'#111'}} onClick={()=>setGuidedHospitality(true)}>Start a guided demo booking →</button>}
    {slug==='showcase-clinicgpt'&&<button className="px-5 py-3 text-left text-sm" style={{background:'#e8c866',color:'#111'}} onClick={()=>setGuidedClinic(true)}>Book a demo appointment →</button>}
    {demo && <a href="/ai-bot-demos" target="_blank" rel="noopener noreferrer" className="block border-b border-white/10 px-5 py-3 text-sm font-semibold" style={{color:'#f3e5b5',background:'#161616'}}>Explore AI Bot Demos ↗</a>}
    {!demo && (!portalEnabled || portalView === "chat") && !menuOpen && !bookingItem && <header className={portal.mobileChatHeader}>
      {menu.enabled && <button type="button" aria-label="Show options" onClick={() => { composerRef.current?.blur(); setMobileInfoOpen(false); setMenuOpen(true); }}><LayoutGrid size={20} /></button>}
      <span className={portal.mobileLogo} aria-hidden="true" style={{backgroundColor:accent,color:accentText}}><SafeBotLogo src={logoUrl} fallback={botName.slice(0, 1).toUpperCase()} /></span><div className={portal.mobileIdentity}><h1>{botName}</h1><span><i aria-hidden="true" />AI ready</span></div>
      <button type="button" aria-label="Bot information" aria-expanded={mobileInfoOpen} onClick={() => setMobileInfoOpen(value => !value)}><Info size={19} /></button>
      {dismissible && <button type="button" aria-label="Close mobile assistant" onClick={dismissWidget}><X size={20} /></button>}
      {mobileInfoOpen && <div className={portal.mobileInfo}><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy</a><span>Powered by AiFrogi</span><span>Please do not share passwords, OTPs or payment details.</span></div>}
    </header>}
    {isWebtechnosys ? <header className={shell.header} style={{ "--shell-gold": accent } as CSSProperties}>
      <div className={shell.headerRow}><div className={shell.identity}><div className={shell.avatar} aria-hidden="true"><SafeBotLogo src={logoUrl} fallback={botName.slice(0, 1).toUpperCase()} /></div><div className={shell.name}><h1>{botName}</h1>{liveStatus && <p className={shell.status} role="status">{liveStatus}</p>}</div></div>{dismissible && <button type="button" className={shell.dismiss} onClick={dismissWidget} aria-label="Close AI Bot"><X aria-hidden="true" /></button>}</div>
      <button type="button" className={shell.human} disabled={helpDisabled} onClick={prepareHumanHelp} title={helpDisabled ? "Human help is currently unavailable" : "Prepare a human handover request"}><Headset aria-hidden="true" />{conversationState === "HUMAN_JOINED" ? "View team reply" : conversationState === "HUMAN_REQUESTED" ? "View human request" : "Human help"}</button>
    </header> : isHotelGuest ? <header className={hotel.header}><span className={hotel.avatar} aria-hidden="true"><SafeBotLogo src={logoUrl} fallback={botName.slice(0, 1).toUpperCase()} /></span><div className={hotel.identity}><p className={hotel.journey}>{residentMode ? "During your stay" : "Plan your stay"}</p><h1>{botName}</h1><p className={hotel.status}>{liveStatus || (residentMode ? "Front desk online" : "Hotel assistant online")}</p></div><button type="button" className={`${hotel.help} ${hotel.humanTransfer}`} disabled={helpDisabled} onClick={prepareHumanHelp} aria-label={conversationState === "HUMAN_JOINED" ? "View front desk reply" : "Transfer to a human"} title={helpDisabled ? "Human help is currently unavailable" : "Transfer to a human"}><Headset aria-hidden="true" /></button>{menu.enabled ? <button type="button" className={hotel.help} onClick={() => { if (portalEnabled) setPortalView("home"); setBookingItem(null); setMenuOpen(true); setMenuRevision(current => current + 1); }} aria-label="Show guest options"><LayoutGrid aria-hidden="true" /></button> : null}{dismissible ? <button type="button" className={hotel.dismiss} onClick={dismissWidget} aria-label="Close assistant"><X aria-hidden="true" /></button> : null}</header> : <header className="border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-3"><span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-bold" style={{ backgroundColor: accent, color: accentText }}><SafeBotLogo src={logoUrl} fallback={botName.slice(0, 1).toUpperCase()} className="h-9 w-9 object-contain" /></span><div className="min-w-0"><p className="text-[10px] uppercase tracking-[.18em] text-white/70">AI BUSINESS BOT</p><h1 className="truncate text-base font-semibold sm:text-lg">{botName}</h1></div></div><p className="mt-1 pl-12 text-xs text-white/48">{demo ? "Mock connectors · No real transaction or notification" : conversationState === "RECONNECTING" ? "Reconnecting to your conversation…" : conversationState === "CLOSED" ? "Conversation closed" : conversationState === "HUMAN_JOINED" ? "Business team replying" : conversationState === "HUMAN_REQUESTED" ? "Human help requested · Awaiting reply" : handoffAvailable === false ? "AI ready · Human handover unavailable" : "AI ready"}</p></div><div className="flex shrink-0 items-center gap-2">{demo ? <span className="hidden rounded-full border border-[#e2c66d]/45 bg-[#8a6a16]/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.14em] text-[#f3e5b5] sm:inline-flex">Demo · Synthetic</span> : null}{dismissible ? <button type="button" onClick={dismissWidget} aria-label="Close AI Bot" className={shell.genericDismiss}><X size={18} strokeWidth={2.5} aria-hidden="true" /></button> : null}</div></div></header>}
    {portalEnabled && portalView === "chat" && <div className={portal.backRow}><button type="button" onClick={() => setPortalView("messages")}><ChevronLeft size={16} aria-hidden="true" />Messages</button></div>}
    {portalEnabled && portalView !== "chat" && <section className={portal.content} aria-label={`${portalView} view`}>
      <h2 className={portal.title}>{({home: "How can we help?", messages: "Messages", help: "Help", updates: "Updates"} as const)[portalView]}</h2>
      {portalView === "home" && <><p className={portal.intro}>{welcomeMessage}</p><button type="button" className={portal.primary} onClick={openChat}>Ask a question <MessageCircle size={18} aria-hidden="true" /></button>{menu.enabled && <WebtechnosysNavigation menu={menu} journey={hotelJourney || undefined} onChat={openChat} onFlow={openFlow} onBooking={item => { setPortalView("chat"); setMenuOpen(false); setBookingDestination(""); setBookingItem(item); }} />}</>}
      {portalView === "messages" && <><p className={portal.intro}>Your conversation in this browser session.</p><button type="button" className={portal.conversation} onClick={openChat}><span className={portal.conversationName}>{botName}</span><span>{messages[messages.length - 1]?.text || welcomeMessage}</span><small>{liveStatus || "Continue your conversation"}</small></button><button type="button" className={portal.primary} onClick={openChat}>Ask a question <MessageCircle size={18} aria-hidden="true" /></button></>}
      {portalView === "help" && <><p className={portal.intro}>Explore the business options or ask the assistant a question.</p>{menu.enabled && <WebtechnosysNavigation menu={menu} journey={hotelJourney || undefined} onChat={openChat} onFlow={openFlow} onBooking={item => { setPortalView("chat"); setMenuOpen(false); setBookingDestination(""); setBookingItem(item); }} />}<button type="button" className={portal.primary} onClick={openChat}>Ask a question</button><button type="button" className={portal.secondary} disabled={helpDisabled} onClick={prepareHumanHelp}><Headset size={18} aria-hidden="true" />{residentMode ? "Contact the front desk" : "Human help"}</button>{handoffAvailable === false && <p className={portal.intro}>Human help is currently unavailable.</p>}</>}
      {(portalView === "updates" || portalView === "home") && <><ShowcaseCarousel items={showcaseItems} />{(welcomeCardTitle || welcomeCardText || welcomeCardImageUrl) && <article className={portal.update}>{welcomeCardImageUrl && <img src={welcomeCardImageUrl} alt="" />}{welcomeCardTitle && <h3>{welcomeCardTitle}</h3>}{welcomeCardText && <p>{welcomeCardText}</p>}</article>}{portalView === "updates" && !showcaseItems.length && !welcomeCardTitle && !welcomeCardText && !welcomeCardImageUrl && <p className={portal.intro}>No updates to share yet.</p>}</>}
    </section>}
    {!portalEnabled && menu.enabled && !isHotelGuest && <div className={shell.switcher} data-chat={!menuOpen} role="group" aria-label="Bot view"><span className={shell.indicator} aria-hidden="true" /><button type="button" aria-pressed={menuOpen} onClick={() => { setBookingItem(null); setMenuOpen(true); setMenuRevision(current => current + 1); transcriptRef.current?.scrollTo({ top: 0 }); }}><LayoutGrid aria-hidden="true" />Main menu</button><button type="button" aria-pressed={!menuOpen} onClick={openChat}><MessageCircle aria-hidden="true" />Chat</button></div>}
    <section data-chat-active={!demo || undefined} hidden={portalEnabled && portalView !== "chat"} ref={transcriptRef} aria-live="polite" className={isWebtechnosys ? shell.transcript : isHotelGuest ? hotel.transcript : "flex-1 space-y-3 overflow-y-auto px-4 py-5"}>{bookingItem?.value ? <BookingSearchCard item={bookingItem} initialDestination={bookingDestination} onBack={()=>{setBookingItem(null);setBookingDestination("");setMenuOpen(true);}} /> : <>{!portalEnabled && <ShowcaseCarousel items={showcaseItems} />}{!portalEnabled && (welcomeCardTitle || welcomeCardText || welcomeCardImageUrl) ? <article className="mb-3 overflow-hidden rounded-2xl border border-[var(--widget-line)] bg-[var(--widget-surface)]"><div>{welcomeCardImageUrl ? <img src={welcomeCardImageUrl} alt="" className="max-h-36 w-full object-cover" /> : null}</div><div className="p-4">{welcomeCardTitle ? <h2 className="text-sm font-semibold text-[var(--widget-ink)]">{welcomeCardTitle}</h2> : null}{welcomeCardText ? <p className="mt-1 text-xs leading-5 text-[var(--widget-muted)]">{welcomeCardText}</p> : null}</div></article> : null}{menu.enabled && menuOpen && <WebtechnosysNavigation key={menuRevision} onChat={openChat} onFlow={openFlow} onBooking={(item)=>{setBookingDestination("");setBookingItem(item);}} menu={menu} journey={hotelJourney || undefined} />}<div className={isWebtechnosys ? shell.messages : isHotelGuest ? hotel.messages : "contents"} hidden={menu.enabled && menuOpen}>{welcomePending && <div className={portal.typingBubble} role="status" aria-label="Preparing welcome"><span className={portal.typingDots} aria-hidden="true"><i /><i /><i /></span></div>}{isWebtechnosys&&messages.length===1?<div className={shell.suggestions} aria-label="Popular questions"><p>Popular questions</p><div>{webtechnosysSuggestions.map(question=><button key={question} type="button" onClick={()=>{setText(question);window.setTimeout(()=>composerRef.current?.focus(),0)}}>{question}</button>)}</div></div>:null}{messages.map((message, index) => <div hidden={welcomePending && index === 0} data-visitor={message.role === "visitor"} data-reply-id={message.replyId} key={message.replyId || index} className={`${portalEnabled ? portal.messageEntry : ""} ${message.role === "visitor" ? "ml-auto max-w-[88%]" : "max-w-[88%]"}`}><p style={message.role === "visitor" ? { backgroundColor: accent, color: accentText } : undefined} className={`whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "visitor" ? "bg-[#8a6a16]" : "border border-[var(--widget-line)] bg-[var(--widget-soft)] text-[var(--widget-ink)]"}`}><RichMessageText text={message.text} /></p>{message.role === "bot" && message.answerActions?.length ? <div className={portal.answerActions}>{message.answerActions.filter(action => safeAnswerUrl(action.url)).slice(0, 3).map(action => <a key={action.url} href={safeAnswerUrl(action.url)!} target="_blank" rel="noopener noreferrer" style={{backgroundColor:accent,color:accentText}}>{action.label}</a>)}</div> : null}{message.role==="bot"&&message.retryText?<button type="button" onClick={()=>{setText(message.retryText!);window.setTimeout(()=>composerRef.current?.focus(),0)}} className="mt-2 rounded-full border border-[var(--widget-line)] bg-[var(--widget-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--widget-ink)]">Try again</button>:null}{!residentMode&&message.role==="bot"&&message.smartContent?.statusLabel?<span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{message.smartContent.statusLabel}</span>:null}{!residentMode&&message.role==="bot"&&message.smartContent?.quickReplies?.length?<div className="mt-2 flex flex-wrap gap-2">{message.smartContent.quickReplies.map(reply=><button key={reply} type="button" onClick={()=>{setText(reply);window.setTimeout(()=>composerRef.current?.focus(),0)}} className="rounded-full border border-[var(--widget-line)] bg-[var(--widget-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--widget-ink)]">{reply}</button>)}</div>:null}{message.role === "bot" && message.evidenceId ? <div className="mt-1.5 px-2 text-[11px] text-[var(--widget-muted)]">{message.feedback === undefined ? message.chooseFeedbackReason ? <div><p className="mb-2 text-[var(--widget-muted)]">What should be improved?</p><div className="flex flex-wrap gap-1.5">{negativeReasons.map((reason) => <button key={reason} type="button" onClick={() => submitFeedback(index, false, reason)} className="rounded-full border border-[var(--widget-line)] px-2.5 py-1 text-[var(--widget-muted)] hover:border-[#8a6a16] hover:text-[#8a6a16]">{reason}</button>)}</div></div> : <div className="flex items-center gap-2"><span>Did this answer help?</span><button type="button" onClick={() => submitFeedback(index, true)} className="rounded-full border border-[var(--widget-line)] px-2.5 py-1 text-[var(--widget-muted)] hover:border-[#8a6a16] hover:text-[#8a6a16]">Yes</button><button type="button" onClick={() => setMessages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, chooseFeedbackReason: true } : item))} className="rounded-full border border-[var(--widget-line)] px-2.5 py-1 text-[var(--widget-muted)] hover:border-[#8a6a16] hover:text-[#8a6a16]">No</button></div> : <p className={message.feedback ? "text-[#238761]" : "text-[#8a6a16]"}>{message.feedbackNotice || "Feedback saved."}</p>}</div> : null}</div>)}{waiting ? portalEnabled ? <div className={portal.typingBubble} role="status" aria-label="Assistant is replying"><span className={portal.typingDots} aria-hidden="true"><i /><i /><i /></span></div> : isHotelGuest ? <div className={hotel.typingBubble} role="status"><span className={hotel.srOnly}>{residentMode ? "Sending to the front desk" : "Hotel assistant is replying"}</span><span className={hotel.typingDots} aria-hidden="true"><i /><i /><i /></span></div> : <p className="w-fit rounded-2xl border border-[var(--widget-line)] bg-[var(--widget-soft)] px-4 py-3 text-sm text-[#8a6a16]">{residentMode?"Sending to front desk…":"Checking approved information…"}</p> : null}</div></>}</section>
    <form data-portal-composer={!demo || undefined} hidden={portalEnabled && portalView !== "chat"} onSubmit={send} className={isWebtechnosys ? shell.composer : isHotelGuest ? hotel.composer : "border-t border-white/10 p-3"}>
      {conversationState === "HUMAN_JOINED" ? <div className={shell.sessionChoice} role="status"><p>{residentMode?"The front desk is handling this request.":"The business team owns this conversation, so AI replies are paused."}</p>{residentMode?null:<button type="button" onClick={startNewAiConversation}>Start a new AI chat</button>}</div> : null}
      {conversationState === "CLOSED" ? <div className={shell.sessionChoice} role="status"><p>This conversation has ended. Start a fresh chat to continue.</p><button type="button" onClick={startNewAiConversation}>Start a new AI chat</button></div> : null}
      {qualification?.contactEligible && qualification.nextField === "contact" ? <fieldset className="mb-3 grid gap-2 rounded-xl border-2 border-[#b18a25] bg-[var(--widget-soft)] p-3 shadow-[0_0_0_3px_rgba(177,138,37,.12)]"><legend className="px-1 text-xs font-semibold text-[var(--widget-ink)]">Would you like a private callback?</legend><p className="text-[11px] leading-4 text-[var(--widget-muted)]">Your details remain confidential and will be used only by this business to respond to your enquiry.</p><input aria-label="Your name" value={contactName} onChange={(event)=>setContactName(event.target.value)} maxLength={100} placeholder="Your name" className="rounded-lg border border-[var(--widget-line)] bg-[var(--widget-control)] px-3 py-2 text-sm outline-none" /><input type="tel" inputMode="tel" autoComplete="tel" aria-label="Mobile number" value={contactValue} onChange={(event)=>setContactValue(event.target.value)} maxLength={24} placeholder="Mobile number" className="rounded-lg border border-[var(--widget-line)] bg-[var(--widget-control)] px-3 py-2 text-sm outline-none" /><label className="flex items-start gap-2 text-[11px] leading-4 text-[var(--widget-muted)]"><input type="checkbox" checked={contactConsent} onChange={(event)=>setContactConsent(event.target.checked)} className="mt-0.5 size-4 shrink-0" />I agree that this business may securely store these details and contact me only about this enquiry.</label></fieldset> : null}
      <div className={!demo ? portal.composerRow : "flex gap-2"}>{!demo && <><VoiceIntakeControl languageCodes={isHotelGuest ? undefined : ["en-IN", "hi-IN", "fr-FR", "es-ES"]} disabled={(portalEnabled && portalView !== "chat") || waiting || ["CLOSED", "RECONNECTING"].includes(conversationState)} onConfirm={input => { setConfirmedVoice(input); setText(input.transcript); window.setTimeout(() => composerRef.current?.focus(), 0); }} /><EmojiPicker disabled={(portalEnabled && portalView !== "chat") || waiting || ["CLOSED", "RECONNECTING"].includes(conversationState)} onSelect={emoji => { const input = composerRef.current; const start = input?.selectionStart ?? text.length; const end = input?.selectionEnd ?? start; const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`.slice(0, 1200); setText(next); setConfirmedVoice(null); window.requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(Math.min(start + emoji.length, next.length), Math.min(start + emoji.length, next.length)); }); }} /></>}{isHotelGuest && demo ? <VoiceIntakeControl disabled={waiting || ["CLOSED", "RECONNECTING"].includes(conversationState)} onConfirm={input => { setConfirmedVoice(input); setText(input.transcript); window.setTimeout(() => composerRef.current?.focus(), 0); }} /> : null}<input ref={composerRef} aria-label="Message" value={text} onChange={(event) => { setText(event.target.value); if (confirmedVoice && event.target.value !== confirmedVoice.transcript) setConfirmedVoice(null); }} placeholder={residentMode?"Message the front desk…":conversationState === "HUMAN_JOINED" ? isHotelGuest ? "Message the hotel team…" : "Message the business team…" : qualification?.nextField === "contact" ? "Add a note, or share mobile above…" : isHotelGuest ? "Ask about your stay…" : isWebtechnosys ? "Ask Webtechnosys…" : "Ask the business…"} className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/7 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-[#8a6a16]" /><button type="submit" aria-label="Send message" style={isWebtechnosys ? { backgroundColor: "#e4ca82", color: "#17130a" } : { backgroundColor: accent, color: accentText }} disabled={waiting || (!text.trim() && !canShareContact) || ["CLOSED", "RECONNECTING"].includes(conversationState)} className={`rounded-xl px-4 text-sm font-semibold disabled:opacity-40 ${isWebtechnosys ? "" : "bg-[#8a6a16]"}`}>{!demo || isWebtechnosys || isHotelGuest ? <ArrowUp size={20} aria-hidden="true" /> : "Send"}</button></div>{confirmedVoice ? <p role="status" className={isHotelGuest ? hotel.microcopy : "mt-2 text-center text-[10px] text-emerald-600"}>Confirmed {confirmedVoice.languageLabel} voice transcript — review once more, then send.</p> : null}{isWebtechnosys && humanHelpDraft && <p role="status">Press Send to request human help.</p>}{demo ? <p className="mt-2 text-center text-[10px] font-semibold text-[#e2c66d]">DEMO only — use fictional contact details. Data may be reset.</p> : <p className={!demo ? portal.privacyNote : isHotelGuest ? hotel.microcopy : "mt-2 text-center text-[10px] text-white/38"}>Please do not share passwords, OTPs or payment details.</p>}{demo && <p className={isHotelGuest ? hotel.microcopy : "mt-1 text-center text-[10px] text-[#e2c66d]"}>Powered by AiFrogi</p>}{isHotelGuest || !demo ? null : <a href="https://app.aifrogi.com/login?returnTo=%2Fteam-inbox" target="_blank" rel="noopener noreferrer" className="mt-2 block text-center text-xs underline" style={{color:"#bcb8ab"}}>Front desk login ↗</a>}
    </form>
    {!demo && <><footer className={portal.footer}><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy</a><span>Powered by AiFrogi</span></footer>{portalEnabled && <nav className={portal.navigation} aria-label="Assistant navigation">{(["home", "messages", "help", "updates"] as const).map(view => <button key={view} type="button" aria-current={portalView === view || (view === "messages" && portalView === "chat") ? "page" : undefined} onClick={() => setPortalView(view)}>{view === "home" ? <Home size={19} aria-hidden="true" /> : view === "messages" ? <MessageCircle size={19} aria-hidden="true" /> : view === "help" ? <CircleHelp size={19} aria-hidden="true" /> : <Bell size={19} aria-hidden="true" />}<span>{view[0].toUpperCase() + view.slice(1)}</span></button>)}</nav>}</>}
  </main>;
}
