import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

type IconName =
  | "grid"
  | "inbox"
  | "megaphone"
  | "bar-chart-3"
  | "refresh-cw"
  | "message-circle"
  | "plug"
  | "sparkles"
  | "smartphone"
  | "menu"
  | "x"
  | "search"
  | "bell"
  | "arrow-right"
  | "image"
  | "link"
  | "file-text"
  | "phone"
  | "settings"
  | "triangle-alert"
  | "help-circle";

const paths: Record<IconName, ReactElement> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13h4l2 3h4l2-3h4" />
      <path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2-8Z" />
    </>
  ),
  megaphone: (
    <>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5" />
      <path d="M7 11V8a1 1 0 0 1 .55-.89l9-4.5A1 1 0 0 1 18 3.5v17a1 1 0 0 1-1.45.89l-9-4.5A1 1 0 0 1 7 15v-4Z" />
    </>
  ),
  "bar-chart-3": (
    <>
      <path d="M3 21h18" />
      <path d="M7 16V8" />
      <path d="M12 16V4" />
      <path d="M17 16v-6" />
    </>
  ),
  "refresh-cw": (
    <>
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15.5-6.36L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15.5 6.36L3 16" />
    </>
  ),
  "message-circle": (
    <>
      <path d="M7 18l-4 3 1-5a8 8 0 1 1 3 2Z" />
    </>
  ),
  plug: (
    <>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M5 8h14v2a7 7 0 0 1-14 0Z" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
      <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9Z" />
      <path d="M5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9Z" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 15-4.5-4.5L7 20" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 1 1 7 7l-1 1" />
      <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </>
  ),
  "file-text": (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.94.33 1.86.62 2.74a2 2 0 0 1-.45 2.11L8 9.83a16 16 0 0 0 6.17 6.17l1.26-1.28a2 2 0 0 1 2.11-.45c.88.29 1.8.5 2.74.62A2 2 0 0 1 22 16.92Z" />
    </>
  ),
  settings: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.04.04a2 2 0 1 1-2.83 2.83l-.04-.04a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.17a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.04.04A2 2 0 1 1 2.4 18.86l.04-.04a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H1a2 2 0 1 1 0-4h.17a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.04-.04A2 2 0 1 1 4.54 3.32l.04.04a1.65 1.65 0 0 0 1.82.33H6.4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.17a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.04-.04A2 2 0 1 1 19.6 5.14l-.04.04a1.65 1.65 0 0 0-.33 1.82V7a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.17a1.65 1.65 0 0 0-1.51 1Z" />
    </>
  ),
  "triangle-alert": (
    <>
      <path d="m12 3 10 18H2L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 18h.01" />
    </>
  ),
  "help-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.8.45-1.3.95-1.3 1.9" />
      <path d="M12 17h.01" />
    </>
  )
};

export function Icon({
  name,
  className
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4", className)}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
