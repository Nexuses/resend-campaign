"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppNav } from "@/app/components/AppNav";

type Contact = {
  firstname: string;
  lastname: string;
  company: string;
  email: string;
  status: string;
  resendId?: string;
  error?: string;
  sentAt?: string;
};

type Campaign = {
  _id: string;
  name: string;
  subject: string;
  status: string;
  html: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  contacts: Contact[];
  createdAt?: string;
  completedAt?: string;
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campaigns/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setCampaign(data.campaign);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Link
          href="/history"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← History
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-[var(--muted)]">Loading…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-[var(--danger)]">{error}</p>
        ) : campaign ? (
          <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
                  {campaign.name}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {campaign.subject}
                </p>
              </div>
              <a
                href={`/api/campaigns/${params.id}/export`}
                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                Download CSV
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Total", value: campaign.stats.total },
                { label: "Sent", value: campaign.stats.sent },
                { label: "Failed", value: campaign.stats.failed },
                { label: "Pending", value: campaign.stats.pending },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <p className="text-xs text-[var(--muted)]">{stat.label}</p>
                  <p className="mt-1 text-2xl font-medium">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--bg)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.contacts.map((c, i) => (
                    <tr key={`${c.email}-${i}`} className="border-t border-[var(--line)]">
                      <td className="px-4 py-3">
                        {[c.firstname, c.lastname].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3">{c.company || "—"}</td>
                      <td className="px-4 py-3">{c.email}</td>
                      <td className="px-4 py-3 capitalize">{c.status}</td>
                      <td className="px-4 py-3 text-[var(--danger)]">
                        {c.error || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
