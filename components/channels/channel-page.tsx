"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";

type ChannelPageProps = {
  title: string;
  subtitle: string;
  eyebrow: string;
  highlights: Array<{ label: string; value: string; tone?: "primary" | "secondary" | "tertiary" | "neutral" }>;
  steps: string[];
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ChannelPage({
  title,
  subtitle,
  eyebrow,
  highlights,
  steps,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel
}: ChannelPageProps) {
  return (
    <div className="space-y-8 px-5 py-6 sm:px-8">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,rgba(63,42,168,0.12),rgba(255,255,255,0.92))] p-7 shadow-[0_18px_60px_-24px_rgba(63,42,168,0.35)]">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="primary">{eyebrow}</Badge>
          <Badge tone="neutral">Lead capture channel</Badge>
        </div>
        <h2 className="mt-5 max-w-3xl text-4xl font-black tracking-tight">{title}</h2>
        <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--text-muted)]">{subtitle}</p>
      </Card>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{item.label}</p>
            <p className="mt-4 text-2xl font-black">{item.value}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.85fr)]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold">How it works</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">A simple capture flow for hotel teams.</p>
            </div>
            <Icon name="arrow-right" className="h-5 w-5 text-[var(--primary)]" />
          </div>

          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-3xl bg-[var(--surface-soft)] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-white">
                  {index + 1}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-semibold leading-6 text-[var(--text-body)]">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Actions</p>
          <div className="mt-4 grid gap-3">
            <Link href={primaryHref}>
              <Button className="w-full justify-start">{primaryLabel}</Button>
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref}>
                <Button tone="surface" className="w-full justify-start">
                  {secondaryLabel}
                </Button>
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
