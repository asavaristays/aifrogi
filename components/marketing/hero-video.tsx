"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./sovereign-hero.module.css";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const replay = () => {
    const video = videoRef.current;
    if (!video?.hasAttribute("src") || !video.paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.currentTime = 0;
    video.play().catch(() => { /* Keep the opening frame if playback is blocked. */ });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 639px)");
    const sync = () => {
      if (motion.matches) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } else {
        video.src = "/media/hero/aifrogi-opening.mp4";
        video.play().catch(() => { /* Poster remains if autoplay is blocked. */ });
      }
    };
    sync();
    motion.addEventListener("change", sync);
    return () => { motion.removeEventListener("change", sync); video.pause(); };
  }, []);

  return (
    <div className={`${styles.visual} relative mx-auto w-full max-w-[430px] lg:max-w-[510px]`}>
      <Image className={styles.staticPoster} src="/media/hero/aifrogi-opening.jpg"
        alt="Black and gold AiFrogi business bot" width={640} height={800} priority />
      <video ref={videoRef} className={styles.video} width={640} height={800}
        poster="/media/hero/aifrogi-opening.jpg" muted playsInline preload="none"
        aria-label="Animated black and gold AiFrogi business bot"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) replay();
        }}
        onEnded={() => { const video = videoRef.current; if (video) { video.pause(); video.currentTime = 0; } setPlaying(false); }}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onError={() => { const video = videoRef.current; if (video?.hasAttribute("src")) { video.removeAttribute("src"); video.load(); } }} />
      <button type="button" className={styles.motionControl}
        onClick={() => { const video = videoRef.current; if (video && !video.paused) video.pause(); else replay(); }}
        aria-label={playing ? "Pause hero animation" : "Replay hero animation"}>
        {playing ? "Pause animation" : "Replay animation"}
      </button>
    </div>
  );
}
