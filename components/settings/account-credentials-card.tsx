"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  initialUsername: string;
  initialPassword: string;
  initialLabel: string;
};

export function AccountCredentialsCard({ initialUsername, initialPassword, initialLabel }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [label, setLabel] = useState(initialLabel);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password,
          label
        })
      });

      if (!response.ok) {
        throw new Error("Unable to save credentials");
      }

      setStatus("Credentials updated successfully.");
    } catch {
      setStatus("Could not save credentials right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-extrabold">Username & Password</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Update the AiFrogi access password. Approved Super Admin and client support identities use this credential,
            while their email determines which dashboard they can access. The password is stored hashed and is never shown again.
          </p>
        </div>
        <div className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Account Access
        </div>
      </div>

      <form className="mt-6 space-y-6" onSubmit={saveCredentials}>
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-[var(--text)]">
            <span>Primary login username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              placeholder="owner@hotel.com"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[var(--text)]">
            <span>Login password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              placeholder="Enter a new password"
            />
          </label>
          <label className="space-y-2 text-sm font-semibold text-[var(--text)] lg:col-span-2">
            <span>Login label</span>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
              placeholder="Workspace administrator"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-muted)]">Passwords are stored hashed. Leave blank to keep the current one.</p>
          <div className="flex items-center gap-3">
            {status ? <span className="text-sm font-medium text-[var(--primary)]">{status}</span> : null}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save credentials"}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
