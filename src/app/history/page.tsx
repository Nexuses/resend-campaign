"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppNav } from "@/app/components/AppNav";

type CampaignListItem = {
  _id: string;
  name: string;
  subject: string;
  status: string;
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  createdAt?: string;
  completedAt?: string;
};

export default function HistoryPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/campaigns");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setCampaigns(data.campaigns || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl tracking-tight">
          Campaign history
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Stats for every blast. Open a campaign to download CSV.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-[var(--muted)]">Loading…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-[var(--danger)]">{error}</p>
        ) : campaigns.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-sm text-[var(--muted)]">
            No campaigns yet.{" "}
            <Link href="/" className="text-[var(--accent)] underline">
              Create your first blast
            </Link>
            .
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--bg)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Failed</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c._id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-[var(--muted)]">{c.subject}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{c.status}</td>
                    <td className="px-4 py-3">
                      {c.stats.sent}/{c.stats.total}
                    </td>
                    <td className="px-4 py-3">{c.stats.failed}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/history/${c._id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
