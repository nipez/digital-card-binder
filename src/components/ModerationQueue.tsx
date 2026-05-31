"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { demoSubmissions } from "@/lib/demo-data";

export function ModerationQueue() {
  return (
    <div className="grid gap-4">
      {demoSubmissions.map((submission) => (
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
            <p className="mt-3 text-xs font-semibold uppercase text-archive-ink/50">
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-field px-3 text-sm font-bold text-white">
              <Check className="h-4 w-4" /> Approve
            </button>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-oxblood px-3 text-sm font-bold text-white">
              <X className="h-4 w-4" /> Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
