"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./hotelgpt-launch-page.module.css";

const scenes = [
  {
    id: "prestay",
    number: "01",
    short: "PreStay",
    title: "Turn questions into confident stay decisions.",
    copy: "Answer from approved hotel knowledge, understand stay requirements and move the right enquiry towards a human or direct-booking conversation.",
    accent: "mint",
    status: "Guest planning a stay",
    messages: [
      ["guest", "We are two adults planning a quiet weekend. Which room would suit us?"],
      ["bot", "I can help. What dates are you considering, and would you prefer a garden or sea-facing room?"],
      ["guest", "12–14 September. Sea-facing, if available."],
    ],
    result: "Stay intent captured · Ready for approved guidance",
  },
  {
    id: "instay",
    number: "02",
    short: "InStay",
    title: "Make every guest request visible and owned.",
    copy: "A verified in-house guest raises a request. HotelGPT acknowledges receipt, routes the case to the right department and keeps guest communication under staff control.",
    accent: "gold",
    status: "Verified in-house guest",
    messages: [
      ["guest", "Could we have two extra towels in room 204?"],
      ["bot", "Your request has been received and shared with the hotel team."],
      ["team", "Housekeeping accepted · Update ready for guest"],
    ],
    result: "Request owned · Progress traceable",
  },
  {
    id: "poststay",
    number: "03",
    short: "PostStay Review",
    title: "Close the loop before asking for a review.",
    copy: "After resolution, collect private satisfaction feedback first. The hotel can recover an issue or invite a satisfied guest to leave an approved public review.",
    accent: "coral",
    status: "Resolved stay request",
    messages: [
      ["bot", "Was everything resolved to your satisfaction?"],
      ["guest", "Yes, satisfied. Thank you for the quick help."],
      ["team", "Positive feedback received · Review invitation available"],
    ],
    result: "Feedback received · Reputation protected",
  },
] as const;

type SceneId = (typeof scenes)[number]["id"];

export function HotelGptLaunchPage() {
  const [active, setActive] = useState<SceneId>("prestay");
  const [playing, setPlaying] = useState(true);
  const [fading, setFading] = useState(false);
  const transitionTimer = useRef<number | null>(null);
  const sceneIndex = scenes.findIndex((scene) => scene.id === active);
  const scene = scenes[sceneIndex];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setFading(true);
      transitionTimer.current = window.setTimeout(() => {
        setActive((current) => {
          const index = scenes.findIndex((item) => item.id === current);
          return scenes[(index + 1) % scenes.length].id;
        });
        setFading(false);
      }, 360);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
  }, []);

  function selectScene(id: SceneId) {
    setPlaying(false);
    if (id === active || fading) return;
    setFading(true);
    transitionTimer.current = window.setTimeout(() => {
      setActive(id);
      setFading(false);
    }, 360);
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className="product-eyebrow">HotelGPT · Powered by AiFrogi</p>
            <h1>One guest.<br /><span>Three connected moments.</span></h1>
            <p className={styles.lede}>HotelGPT connects the guest journey before, during and after the stay—while your hotel team remains in control.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href="https://app.aifrogi.com/register?source=hotelgpt">Start a 15-day trial <span aria-hidden="true">→</span></a>
              <a className={styles.secondaryButton} href="/downloads/HotelGPT-Premium-eBrochure-v3.pdf" download>Download brochure <span aria-hidden="true">↓</span></a>
            </div>
            <div className={styles.proofLine}>
              <span>Approved knowledge</span><span>Verified guest access</span><span>Human-controlled actions</span>
            </div>
          </div>

          <div className={styles.movie} aria-label="Interactive HotelGPT product journey">
            <div className={styles.movieHeader}>
              <div><span className={styles.liveDot} /> PRODUCT JOURNEY</div>
              <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause product journey" : "Play product journey"}>{playing ? "Ⅱ" : "▶"}</button>
            </div>
            <div className={`${styles.scene} ${styles[scene.accent]} ${fading ? styles.sceneFadeOut : styles.sceneFadeIn}`} key={scene.id}>
              <div className={styles.sceneNarrative}>
                <span>{scene.number} / 03</span>
                <p>{scene.short}</p>
                <h2>{scene.title}</h2>
                <small>{scene.copy}</small>
              </div>
              <Phone scene={scene} />
            </div>
            <div className={styles.timeline}>
              {scenes.map((item) => <button type="button" key={item.id} onClick={() => selectScene(item.id)} className={item.id === scene.id ? styles.activeTimeline : ""}><span>{item.number}</span>{item.short}</button>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.journeySection} id="journey">
        <div className={styles.sectionIntro}>
          <div><p className="product-eyebrow">The connected guest journey</p><h2>Not another chatbot.<br />A hotel operating layer.</h2></div>
          <p>Each moment has a different job. HotelGPT keeps the experience continuous without confusing public enquiries, verified in-stay requests and post-resolution feedback.</p>
        </div>
        <div className={styles.journeyCards}>
          {scenes.map((item) => (
            <article key={item.id} className={styles.journeyCard}>
              <span>{item.number}</span><p>{item.short}</p><h3>{item.title}</h3><small>{item.copy}</small>
              <button type="button" onClick={() => { selectScene(item.id); document.querySelector(`.${styles.movie}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>View in product movie →</button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.controlSection}>
        <div className={styles.controlVisual}>
          <div className={styles.controlOrb}><span>Hotel</span><strong>Intelligence</strong><small>Owned &amp; approved</small></div>
          {["Rooms & property", "Policies", "Dining & facilities", "Local guidance"].map((item, index) => <span key={item} className={styles[`orbit${index + 1}`]}>{item}</span>)}
        </div>
        <div className={styles.controlCopy}>
          <p className="product-eyebrow">Sovereign intelligence</p>
          <h2>Your hotel knowledge.<br />Your operating boundaries.</h2>
          <p>HotelGPT responds from approved first-party information. Staff control what is published, when a guest request is acted upon, and when a conversation needs a human.</p>
          <ul><li>Answers grounded in approved hotel content</li><li>PreStay and verified InStay remain separate</li><li>Clear staff ownership, updates and audit trail</li><li>Safe handover when the answer is not approved</li></ul>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div>
          <Image src="/brand/aifrogi-logo-white.png" alt="AiFrogi" width={152} height={54} />
          <p className="product-eyebrow">Review HotelGPT</p>
          <h2>See your guest journey<br />as one connected experience.</h2>
          <p>Start with your hotel’s approved knowledge. Add verified InStay operations when your team is ready.</p>
        </div>
        <div className={styles.contactCard}>
          <a href="https://app.aifrogi.com/register?source=hotelgpt">Start a 15-day trial <span>→</span></a>
          <a href="/downloads/HotelGPT-Premium-eBrochure-v3.pdf" download>Download premium brochure <span>↓</span></a>
          <div><small>Talk to AiFrogi</small><a href="mailto:info@aifrogi.com">info@aifrogi.com</a><a href="tel:+917410582898">+91 74105 82898</a></div>
        </div>
      </section>
    </>
  );
}

function Phone({ scene }: { scene: (typeof scenes)[number] }) {
  return <div className={styles.phoneWrap}>
    <div className={styles.phone}>
      <div className={styles.phoneTop}><span>9:41</span><i /><span>● ●</span></div>
      <div className={styles.appBar}><div className={styles.botMark}>H</div><div><strong>HotelGPT</strong><small>{scene.status}</small></div><b>•••</b></div>
      <div className={styles.chat}>
        <div className={styles.contextTag}>{scene.short}</div>
        {scene.messages.map(([role, text], index) => <div key={`${scene.id}-${index}`} className={`${styles.bubble} ${styles[role]}`}><small>{role === "guest" ? "Guest" : role === "team" ? "Hotel team" : "HotelGPT"}</small>{text}</div>)}
      </div>
      <div className={styles.result}><span>✓</span><p>{scene.result}</p></div>
      <div className={styles.composer}>Type a message… <span>↑</span></div>
    </div>
  </div>;
}
