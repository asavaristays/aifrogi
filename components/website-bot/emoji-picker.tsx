"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Smile, X } from "lucide-react";
import styles from "./bot-portal.module.css";

const emojis = [
  ["😀", "Happy"], ["😊", "Smiling"], ["😄", "Delighted"], ["🙂", "Friendly"],
  ["😍", "Love"], ["🤔", "Thinking"], ["😔", "Sad"], ["😢", "Crying"],
  ["👍", "Thumbs up"], ["👎", "Thumbs down"], ["👏", "Applause"], ["🙌", "Celebration"],
  ["🙏", "Thanks"], ["👋", "Hello"], ["❤️", "Heart"], ["🎉", "Party"],
  ["✅", "Check mark"], ["❓", "Question"], ["💡", "Idea"], ["✨", "Sparkles"],
  ["☕", "Coffee"], ["🍽️", "Dining"], ["🏨", "Hotel"], ["📅", "Calendar"],
] as const;

export function EmojiPicker({ disabled, onSelect }: { disabled: boolean; onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closePanel = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setOpen(false);
    else setClosing(true);
  }, []);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => { setOpen(false); setClosing(false); }, 140);
    return () => window.clearTimeout(timer);
  }, [closing]);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (disabled) closePanel(); }, [disabled, closePanel]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) closePanel(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { closePanel(); trigger.current?.focus(); } };
    const close = () => closePanel();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("aifrogi:widget-close", close);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); window.removeEventListener("aifrogi:widget-close", close); };
  }, [open, closePanel]);
  return <div className={styles.emojiRoot} ref={root}>
    <button ref={trigger} type="button" disabled={disabled} className={styles.toolButton} aria-label="Choose an emoji" title="Choose an emoji" aria-expanded={open} aria-haspopup="dialog" onClick={() => { if (open) closePanel(); else { setClosing(false); setOpen(true); } }}><Smile size={18} aria-hidden="true" /></button>
    {open && <section data-closing={closing} className={`${styles.emojiPanel} ${styles.popupMotion}`} role="dialog" aria-label="Choose an emoji"><div className={styles.emojiHeading}><span>Emoji</span><button type="button" aria-label="Close emoji picker" onClick={() => { closePanel(); trigger.current?.focus(); }}><X size={16} aria-hidden="true" /></button></div><div className={styles.emojiGrid}>{emojis.map(([emoji, label]) => <button key={emoji} type="button" aria-label={label} title={label} onClick={() => { onSelect(emoji); closePanel(); }}>{emoji}</button>)}</div></section>}
  </div>;
}
