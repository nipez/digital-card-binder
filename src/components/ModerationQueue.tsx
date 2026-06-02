"use client";

import Image from "next/image";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import type { CardImageSide } from "@/types/binder";

type PendingSubmission = {
  id: string;
  cardSlug: string;
  cardName: string;
  cardNumber: number;
  team: string;
  side: CardImageSide;
  contributor: string;
  status: "pending";
  submittedAt: string;
  imageUrl: string;
  notes: string | null;
};

type QueueResponse = {
  error?: string;
  submissions?: PendingSubmission[];
};

type ActionResponse = {
  error?: string;
  submission?: {
    id: string;
    status: "approved" | "rejected";
  };
};

export function ModerationQueue() {
  const [token, setToken] = useState("");
  const [submissions, setSubmissions] = useState<PendingSubmission[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [activeId, setActiveId] = useState("");
  const [message, setMessage] = useState("");

  async function loadQueue() {
    if (!token.trim()) {
      setStatus("error");
      setMessage("Enter the admin upload token.");
      return;
    }

    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/admin/scan-submissions", {
      headers: {
        "x-admin-upload-token": token.trim()
      }
    });
    const result = (await response.json()) as QueueResponse;

    if (!response.ok || result.error) {
      setStatus("error");
      setMessage(result.error ?? "Could not load submissions.");
      return;
    }

    setSubmissions(result.submissions ?? []);
    setStatus("ready");
    setMessage(result.submissions?.length ? "" : "No pending scan submissions.");
  }

  async function decideSubmission(submissionId: string, action: "approve" | "reject") {
    setActiveId(submissionId);
    setMessage("");

    const response = await fetch("/api/admin/scan-submissions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-upload-token": token.trim()
      },
      body: JSON.stringify({ submissionId, action })
    });
    const result = (await response.json()) as ActionResponse;

    setActiveId("");

    if (!response.ok || result.error) {
      setStatus("error");
      setMessage(result.error ?? "Could not update submission.");
      return;
    }

    setSubmissions((current) => current.filter((submission) => submission.id !== submissionId));
    setStatus("ready");
    setMessage(`Submission ${result.submission?.status ?? (action === "approve" ? "approved" : "rejected")}.`);
  }

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-lg border border-archive-ink/10 bg-white/66 p-4 shadow-sm md:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-bold">
          Admin upload token
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            type="password"
            placeholder="Paste ADMIN_UPLOAD_TOKEN"
            className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          />
        </label>
        <button
          type="button"
          onClick={loadQueue}
          disabled={status === "loading"}
          className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-md bg-archive-ink px-4 text-sm font-bold text-white disabled:opacity-55"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Load queue
        </button>
      </section>

      {message ? (
        <p className={`rounded-md border p-3 text-sm font-bold ${status === "error" ? "border-archive-oxblood/30 bg-archive-oxblood/10 text-archive-oxblood" : "border-archive-field/25 bg-archive-field/10 text-archive-field"}`}>
          {message}
        </p>
      ) : null}

      {submissions.map((submission) => (
        <article key={submission.id} className="grid gap-4 rounded-lg border border-archive-ink/10 bg-white/66 p-4 shadow-sm md:grid-cols-[120px_1fr_auto]">
          <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-md border border-archive-ink/10">
            <Image src={submission.imageUrl} alt={`${submission.cardName} ${submission.side}`} fill className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-archive-oxblood">{submission.status}</p>
            <h2 className="font-display text-2xl font-bold">{submission.cardName}</h2>
            <p className="mt-1 text-sm text-archive-ink/65">
              {submission.side} scan submitted by {submission.contributor}
            </p>
            <p className="mt-1 text-sm font-semibold text-archive-ink/55">{submission.team}</p>
            {submission.notes ? <p className="mt-3 rounded-md bg-archive-paper/70 p-3 text-sm leading-6 text-archive-ink/70">{submission.notes}</p> : null}
            <p className="mt-3 text-xs font-semibold uppercase text-archive-ink/50">
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decideSubmission(submission.id, "approve")}
              disabled={Boolean(activeId)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-field px-3 text-sm font-bold text-white disabled:opacity-55"
            >
              {activeId === submission.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
            </button>
            <button
              type="button"
              onClick={() => decideSubmission(submission.id, "reject")}
              disabled={Boolean(activeId)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-oxblood px-3 text-sm font-bold text-white disabled:opacity-55"
            >
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
