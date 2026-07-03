"use client";

import { useEffect, useState } from "react";

const useCases = ["Broadcast", "ChatBot", "Payment", "Review", "E-Commerce", "Reminder", "Forms"];

export function RotatingUseCase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % useCases.length);
    }, 1800);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className="inline-grid min-w-[6.8em] grid-cols-1 text-left align-bottom sm:min-w-[6.6em]" aria-live="off">
      <span key={useCases[activeIndex]} className="hero-use-case col-start-1 row-start-1 bg-gradient-to-r from-[#ff8af1] to-[#d92bcb] bg-clip-text text-transparent">
        {useCases[activeIndex]}
      </span>
      <span className="sr-only">Broadcast, ChatBot, Payment, Review, E-Commerce, Reminder, and Forms</span>
    </span>
  );
}
