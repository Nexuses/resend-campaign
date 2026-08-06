"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppNav } from "@/app/components/AppNav";

type SettingsState = {
  fromEmail: string;
  fromName: string;
  hasApiKey: boolean;
  apiKeyPreview?: string;
  configured?: boolean;
};

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [preview, setPreview] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        const data = (await res.json()) as SettingsState & { error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setFromEmail(data.fromEmail || "");
        setFromName(data.fromName || "");
        setHasKey(Boolean(data.hasApiKey));
        setPreview(data.apiKeyPreview || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resendApiKey: apiKey || undefined,
          fromEmail,
          fromName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setHasKey(true);
      setPreview(data.apiKeyPreview || "");
      setApiKey("");
      setMessage("Settings saved. You can blast campaigns now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
          Resend settings
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Configure your Resend API key and from address here. Nothing else is
          needed in env for sending.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-[var(--muted)]">Loading…</p>
        ) : (
          <form
            onSubmit={onSave}
            className="mt-8 space-y-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"
          >
            <div>
              <label className="text-sm font-medium" htmlFor="apiKey">
                Resend API key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasKey
                    ? `Saved: ${preview} — paste to replace`
                    : "re_xxxxxxxx"
                }
                className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 outline-none ring-[var(--accent)] focus:ring-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="fromEmail">
                From email
              </label>
              <input
                id="fromEmail"
                type="email"
                required
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="hello@yourdomain.com"
                className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 outline-none ring-[var(--accent)] focus:ring-2"
              />
              <p className="mt-1.5 text-xs text-[var(--muted)]">
                Must be a verified domain/sender in Resend.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="fromName">
                From name (optional)
              </label>
              <input
                id="fromName"
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Company"
                className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 outline-none ring-[var(--accent)] focus:ring-2"
              />
            </div>

            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}
            {message ? (
              <p className="text-sm text-[var(--accent)]">{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={saving || !fromEmail || (!apiKey && !hasKey)}
              className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
