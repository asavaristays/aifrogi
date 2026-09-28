"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./hotelgpt-launch-page.module.css";

const presentationUrl = "/hotelgpt-presentation/index.html?embedded=1";

export function HotelGptLaunchPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(6536);

  const syncHeight = useCallback(() => {
    const frame = frameRef.current;
    const document = frame?.contentDocument;
    if (!document) {
      setHeight(window.innerWidth <= 600 ? 10100 : window.innerWidth <= 900 ? 8200 : 6536);
      return;
    }
    const nextHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    if (nextHeight > 0) setHeight(nextHeight);
  }, []);

  useEffect(() => {
    const onResize = () => window.requestAnimationFrame(syncHeight);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "hotelgpt-presentation-height") return;
      const nextHeight = Number(event.data.height);
      if (Number.isFinite(nextHeight) && nextHeight > 0) setHeight(nextHeight);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("message", onMessage);
    };
  }, [syncHeight]);

  return (
    <section className={styles.presentationShell} aria-label="HotelGPT product presentation">
      <iframe
        ref={frameRef}
        className={styles.presentationFrame}
        src={presentationUrl}
        title="HotelGPT — Every stay, intelligently handled"
        style={{ height }}
        onLoad={() => {
          syncHeight();
          window.setTimeout(syncHeight, 400);
          window.setTimeout(syncHeight, 1400);
        }}
      />
    </section>
  );
}
