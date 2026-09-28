"use client";

import { FormEvent, useState } from "react";

export function ContactMailForm() {
  const [sent, setSent] = useState(false);

  function openEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const company = String(form.get("company") || "").trim();
    const message = String(form.get("message") || "").trim();
    const subject = `AiFrogi enquiry from ${name || company || "website visitor"}`;
    const body = [`Name: ${name}`, `Email: ${email}`, `Business: ${company || "Not provided"}`, "", message].join("\n");
    setSent(true);
    window.location.href = `mailto:info@aifrogi.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={openEmail} className="rounded-2xl border border-black/10 bg-white p-6 shadow-[0_24px_70px_rgba(16,16,16,.08)] sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <div className="sm:col-span-2"><Field label="Business / hotel" name="company" autoComplete="organization" /></div>
        <label className="sm:col-span-2 text-sm font-semibold text-[#303030]">How can we help?
          <textarea name="message" required rows={5} maxLength={1600} className="mt-2 block w-full resize-y rounded-lg border border-black/14 bg-[#fbfaf7] px-4 py-3 font-normal outline-none transition focus:border-[#8a6a16] focus:ring-2 focus:ring-[#8a6a16]/15" />
        </label>
      </div>
      <button type="submit" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#8a6a16] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#b28728]">Email AiFrogi</button>
      <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">This opens your email app with the details filled in. The form does not upload or store your message.</p>
      {sent ? <p role="status" className="mt-3 text-sm font-semibold text-[#6d5310]">Your email app should open now. If it does not, email info@aifrogi.com directly.</p> : null}
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete, required = false }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-[#303030]">{label}<input name={name} type={type} autoComplete={autoComplete} required={required} maxLength={160} className="mt-2 block min-h-12 w-full rounded-lg border border-black/14 bg-[#fbfaf7] px-4 font-normal outline-none transition focus:border-[#8a6a16] focus:ring-2 focus:ring-[#8a6a16]/15" /></label>;
}
