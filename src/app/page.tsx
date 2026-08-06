"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AppNav } from "@/app/components/AppNav";

type Mapping = {
  firstname: string;
  lastname: string;
  company: string;
  email: string;
};

const FIELD_LABELS: { key: keyof Mapping; label: string; required?: boolean }[] = [
  { key: "firstname", label: "First name" },
  { key: "lastname", label: "Last name" },
  { key: "company", label: "Company name" },
  { key: "email", label: "Email", required: true },
];

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
  <p>Hi {{firstname}},</p>
  <p>Quick note for you at {{company}}.</p>
  <p>Best,<br/>Your Name</p>
</div>`;

function guessMapping(headers: string[]): Mapping {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const find = (...candidates: string[]) => {
    const idx = lower.findIndex((h) =>
      candidates.some((c) => h === c || h.includes(c))
    );
    return idx >= 0 ? headers[idx] : "";
  };

  return {
    firstname: find("first name", "firstname", "first_name", "fname"),
    lastname: find("last name", "lastname", "last_name", "lname"),
    company: find("company name", "company", "organization", "org"),
    email: find("email", "e-mail", "mail"),
  };
}

export default function HomePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({
    firstname: "",
    lastname: "",
    company: "",
    email: "",
  });
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const previewContacts = useMemo(() => {
    if (!mapping.email) return [];
    return rows.slice(0, 5).map((row) => ({
      firstname: mapping.firstname ? row[mapping.firstname] || "" : "",
      lastname: mapping.lastname ? row[mapping.lastname] || "" : "",
      company: mapping.company ? row[mapping.company] || "" : "",
      email: row[mapping.email] || "",
    }));
  }, [rows, mapping]);

  function onFile(file: File | null) {
    if (!file) return;
    setError("");
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length) {
          setError(result.errors[0]?.message || "CSV parse error");
          return;
        }
        const cols = result.meta.fields?.filter(Boolean) || [];
        if (!cols.length) {
          setError("No headers found in CSV");
          return;
        }
        setHeaders(cols);
        setRows(result.data);
        setMapping(guessMapping(cols));
      },
    });
  }

  async function blast() {
    setBusy(true);
    setError("");
    setProgress("Creating campaign…");

    try {
      const createRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, html, mapping, rows }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || "Create failed");

      setProgress(`Sending to ${created.total} contacts… this may take a bit`);
      const sendRes = await fetch(`/api/campaigns/${created.id}/send`, {
        method: "POST",
      });
      const sent = await sendRes.json();
      if (!sendRes.ok) throw new Error(sent.error || "Send failed");

      router.push(`/history/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Blast failed");
      setProgress("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
              New campaign blast
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Upload contacts, map columns, write HTML, then send.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`rounded-full px-3 py-1 ${
                  step === n
                    ? "bg-[var(--accent)] text-white"
                    : step > n
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "bg-black/5 text-[var(--muted)]"
                }`}
              >
                {n === 1
                  ? "Details"
                  : n === 2
                    ? "Contacts"
                    : n === 3
                      ? "HTML"
                      : "Send"}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium" htmlFor="name">
                  Campaign name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 outline-none ring-[var(--accent)] focus:ring-2"
                  placeholder="March outreach"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="subject">
                  Email subject
                </label>
                <input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 outline-none ring-[var(--accent)] focus:ring-2"
                  placeholder="Quick idea for {{company}}"
                />
                <p className="mt-1.5 text-xs text-[var(--muted)]">
                  Supports {"{{firstname}}"}, {"{{lastname}}"}, {"{{company}}"},{" "}
                  {"{{email}}"}.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Contact CSV</label>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)] px-4 py-10 text-center hover:border-[var(--accent)]">
                  <span className="text-sm font-medium">
                    {fileName || "Drop or choose a CSV file"}
                  </span>
                  <span className="mt-1 text-xs text-[var(--muted)]">
                    Headers like firstname, lastname, company, email
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!name.trim() || !subject.trim() || rows.length === 0}
                onClick={() => setStep(2)}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Continue to mapping
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-[var(--muted)]">
                Mapped {rows.length} rows from <strong>{fileName}</strong>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {FIELD_LABELS.map((field) => (
                  <div key={field.key}>
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>
                    <select
                      value={mapping[field.key]}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                      }
                      className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none ring-[var(--accent)] focus:ring-2"
                    >
                      <option value="">— skip —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {previewContacts.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--bg)] text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2 font-medium">First</th>
                        <th className="px-3 py-2 font-medium">Last</th>
                        <th className="px-3 py-2 font-medium">Company</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewContacts.map((c, i) => (
                        <tr key={i} className="border-t border-[var(--line)]">
                          <td className="px-3 py-2">{c.firstname}</td>
                          <td className="px-3 py-2">{c.lastname}</td>
                          <td className="px-3 py-2">{c.company}</td>
                          <td className="px-3 py-2">{c.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!mapping.email}
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Continue to HTML
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium" htmlFor="html">
                  Email HTML pitch
                </label>
                <textarea
                  id="html"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={14}
                  className="mt-2 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 font-mono text-sm outline-none ring-[var(--accent)] focus:ring-2"
                />
                <p className="mt-1.5 text-xs text-[var(--muted)]">
                  Merge tags: {"{{firstname}}"} {"{{lastname}}"} {"{{company}}"}{" "}
                  {"{{email}}"}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Preview</p>
                <iframe
                  title="preview"
                  className="h-64 w-full rounded-xl border border-[var(--line)] bg-white"
                  srcDoc={html
                    .replaceAll("{{firstname}}", previewContacts[0]?.firstname || "Alex")
                    .replaceAll("{{lastname}}", previewContacts[0]?.lastname || "Rivera")
                    .replaceAll("{{company}}", previewContacts[0]?.company || "Acme")
                    .replaceAll("{{email}}", previewContacts[0]?.email || "alex@acme.com")}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!html.trim()}
                  onClick={() => setStep(4)}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  Review & send
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl bg-[var(--bg)] p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-[var(--muted)]">Campaign</p>
                  <p className="font-medium">{name}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Subject</p>
                  <p className="font-medium">{subject}</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Contacts</p>
                  <p className="font-medium">{rows.length} rows uploaded</p>
                </div>
                <div>
                  <p className="text-[var(--muted)]">Email column</p>
                  <p className="font-medium">{mapping.email}</p>
                </div>
              </div>

              <p className="text-sm text-[var(--muted)]">
                Make sure Resend is configured under Settings before blasting.
              </p>

              {progress ? (
                <p className="text-sm text-[var(--accent)]">{progress}</p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={blast}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Blasting…" : "Blast campaign"}
                </button>
              </div>
            </div>
          )}

          {error ? (
            <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
