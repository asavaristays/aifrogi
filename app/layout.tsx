import type { Metadata } from "next";
import "@/app/globals.css";
import { AppStateProvider } from "@/components/providers/app-state-provider";

export const metadata: Metadata = {
  title: "AiFrogi | Business Messaging & Automation",
  description: "WhatsApp messaging, campaigns, AI assistance, automation, and human support in one business workspace.",
  icons: {
    icon: "/brand/aifrogi-favicon.jpg",
    shortcut: "/brand/aifrogi-favicon.jpg",
    apple: "/brand/aifrogi-favicon.jpg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content" tabIndex={-1}>
          <AppStateProvider>{children}</AppStateProvider>
        </div>
      </body>
    </html>
  );
}
