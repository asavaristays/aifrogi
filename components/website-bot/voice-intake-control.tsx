"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { HOTELGPT_VOICE_LANGUAGES, type ConfirmedVoiceInput, type HotelVoiceLanguageCode } from "@/lib/hotelgpt-voice-intake";

type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
type RecognitionEvent = Event & { results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionConstructor = new () => Recognition;

export function VoiceIntakeControl({ disabled, onConfirm }: { disabled: boolean; onConfirm: (input: ConfirmedVoiceInput) => void }) {
  const [open, setOpen] = useState(false);
  const [languageCode, setLanguageCode] = useState<HotelVoiceLanguageCode>("en-IN");
  const [status, setStatus] = useState<"idle" | "listening" | "review" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);
  const supported = typeof window !== "undefined" && Boolean((window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition);

  function start() {
    const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setError("Voice input is not supported in this browser. Please use current Chrome or type your request."); setStatus("error"); return; }
    recognitionRef.current?.abort();
    const recognition = new Constructor();
    recognition.lang = languageCode; recognition.continuous = false; recognition.interimResults = true; recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setTranscript(""); setConfirmed(false); setError(""); setStatus("listening");
    recognition.onresult = event => {
      const words = Array.from(event.results).map(result => result[0]?.transcript || "").join(" ").trim();
      if (words) setTranscript(words.slice(0, 1200));
    };
    recognition.onerror = event => { setError(event.error === "not-allowed" ? "Microphone permission was not granted. You can type the request instead." : "I could not hear that clearly. Please try again or type the request."); setStatus("error"); };
    recognition.onend = () => setStatus(current => current === "error" ? current : "review");
    recognition.start();
  }

  function close() { recognitionRef.current?.abort(); setOpen(false); setStatus("idle"); setTranscript(""); setConfirmed(false); setError(""); }
  const language = HOTELGPT_VOICE_LANGUAGES.find(item => item.code === languageCode)!;

  return <div className="relative shrink-0">
    <button type="button" disabled={disabled} onClick={() => setOpen(value => !value)} aria-label="Speak your message" title="Speak your message" className="grid size-11 place-items-center rounded-xl border border-[var(--widget-line)] bg-[var(--widget-surface)] text-[var(--widget-ink)] disabled:opacity-40"><Mic size={17} aria-hidden="true" /></button>
    {open ? <section className="absolute bottom-14 left-0 z-20 w-[min(340px,calc(100vw-28px))] rounded-2xl border border-[var(--widget-line)] bg-[var(--widget-surface)] p-4 text-[var(--widget-ink)] shadow-2xl" aria-label="Voice message">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">Speak your request</p><p className="mt-1 text-[11px] leading-4 text-[var(--widget-muted)]">Choose your language. Your audio is not stored by AiFrogi.</p></div><button type="button" onClick={close} aria-label="Close voice input" className="grid size-8 place-items-center rounded-lg border border-[var(--widget-line)]"><X size={15} /></button></div>
      <label className="mt-3 block text-xs font-semibold">Spoken language<select value={languageCode} disabled={status === "listening"} onChange={event => setLanguageCode(event.target.value as HotelVoiceLanguageCode)} className="mt-1.5 w-full rounded-lg border border-[var(--widget-line)] bg-[var(--widget-control)] px-3 py-2.5 text-sm">{HOTELGPT_VOICE_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
      {status === "listening" ? <button type="button" onClick={() => recognitionRef.current?.stop()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white"><Square size={14} fill="currentColor" />Stop and review</button> : <button type="button" onClick={start} disabled={!supported} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8a6a16] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Mic size={16} />{transcript ? "Record again" : "Start recording"}</button>}
      {status === "listening" ? <p role="status" className="mt-3 text-center text-xs font-semibold text-red-600">Listening… tap Stop when finished.</p> : null}
      {transcript && status !== "listening" ? <div className="mt-3"><label className="text-xs font-semibold">Check the transcript<textarea value={transcript} onChange={event => { setTranscript(event.target.value.slice(0, 1200)); setConfirmed(false); }} rows={4} className="mt-1.5 w-full resize-none rounded-lg border border-[var(--widget-line)] bg-[var(--widget-control)] px-3 py-2 text-sm leading-5" /></label><label className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-[var(--widget-muted)]"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#8a6a16]" />I confirm this transcript matches what I said.</label><button type="button" disabled={!confirmed || transcript.trim().length < 2} onClick={() => { onConfirm({ confirmed: true, languageCode, languageLabel: language.label, transcript: transcript.trim() }); close(); }} className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Use confirmed transcript</button></div> : null}
      {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</p> : null}
    </section> : null}
  </div>;
}
