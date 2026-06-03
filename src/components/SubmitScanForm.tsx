"use client";

import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import type { Card, CardImageSide } from "@/types/binder";

type SubmitScanResponse = {
  error?: string;
  submission?: {
    id: string;
    cardSlug: string;
    side: CardImageSide;
    status: "pending";
    imageUrl: string;
  };
};

export function SubmitScanForm({ cards }: { cards: Card[] }) {
  const [cardSlug, setCardSlug] = useState(cards[0]?.cardSlug ?? "");
  const [side, setSide] = useState<CardImageSide>("front");
  const [contributorEmail, setContributorEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const selectedCard = useMemo(() => cards.find((card) => card.cardSlug === cardSlug), [cardSlug, cards]);

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cardSlug || !file || !contributorEmail.trim()) {
      setStatus("error");
      setMessage("Choose a card, add your email, and select an image file.");
      return;
    }

    setStatus("submitting");
    setMessage("Uploading your scan for moderation...");

    const formData = new FormData();
    formData.set("cardSlug", cardSlug);
    formData.set("side", side);
    formData.set("contributorEmail", contributorEmail.trim());
    formData.set("notes", notes.trim());
    formData.set("file", file);

    try {
      const response = await fetch("/api/scan-submissions", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as SubmitScanResponse;

      if (!response.ok || result.error) {
        setStatus("error");
        setMessage(result.error ?? "Submission failed.");
        return;
      }

      setStatus("success");
      setMessage(`Submitted ${side} scan for ${selectedCard?.playerName ?? "card"} for moderator review.`);
      setFile(null);
      setNotes("");
    } catch {
      setStatus("error");
      setMessage("Submission failed. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={submitScan} className="grid gap-4 rounded-lg border border-archive-ink/10 bg-white/66 p-6 shadow-card">
      <label className="grid gap-2 text-sm font-bold">
        Card
        <select
          value={cardSlug}
          onChange={(event) => setCardSlug(event.target.value)}
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          required
        >
          {cards.map((card) => (
            <option key={card.id} value={card.cardSlug}>
              {card.year ? `${card.year} ` : ""}
              {card.setName ? `${card.setName} ` : ""}
              {card.numberLabel ?? `#${card.number}`} {card.playerName}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Side
        <select
          value={side}
          onChange={(event) => setSide(event.target.value as CardImageSide)}
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
        >
          <option value="front">Front</option>
          <option value="back">Back</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Contributor email
        <input
          value={contributorEmail}
          onChange={(event) => setContributorEmail(event.target.value)}
          type="email"
          placeholder="collector@example.com"
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional source, condition, or cleanup notes for moderators"
          className="min-h-24 rounded-md border border-archive-ink/14 bg-white px-3 py-2 font-normal outline-none focus:border-archive-oxblood"
        />
      </label>
      <label className="grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-archive-oxblood/40 bg-archive-paper/70 p-6 text-center text-sm font-bold text-archive-oxblood">
        <Upload className="mb-2 h-7 w-7" />
        {file ? file.name : "Upload a front or back scan"}
        <span className="mt-1 text-xs font-semibold text-archive-ink/52">JPG, PNG, or WebP up to 10 MB</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
      </label>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-archive-oxblood px-4 font-bold text-white disabled:opacity-55"
      >
        {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {status === "submitting" ? "Submitting..." : "Submit for moderation"}
      </button>
      {message ? (
        <div
          className={`rounded-md border p-3 text-sm font-bold ${
            status === "success" ? "border-archive-field/25 bg-archive-field/10 text-archive-field" : "border-archive-oxblood/30 bg-archive-oxblood/10 text-archive-oxblood"
          }`}
        >
          {status === "success" ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : <XCircle className="mr-2 inline h-4 w-4" />}
          {message}
        </div>
      ) : null}
    </form>
  );
}
