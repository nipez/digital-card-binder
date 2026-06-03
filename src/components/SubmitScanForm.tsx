"use client";

import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import type { Card, CardImageSide } from "@/types/binder";

type SubmitScanResponse = {
  error?: string;
  submissions?: {
    id: string;
    cardSlug: string;
    side: CardImageSide;
    status: "pending";
    imageUrl: string;
  }[];
};

type CardFilter = "needed" | "complete" | "all";

export function SubmitScanForm({ cards }: { cards: Card[] }) {
  const cardsNeedingScans = useMemo(() => cards.filter((card) => getMissingSides(card).length > 0), [cards]);
  const completeCards = useMemo(() => cards.filter((card) => getMissingSides(card).length === 0), [cards]);
  const [cardFilter, setCardFilter] = useState<CardFilter>(cardsNeedingScans.length ? "needed" : "all");
  const filteredCards = useMemo(() => getCardsForFilter(cardFilter, cards, cardsNeedingScans, completeCards), [cardFilter, cards, cardsNeedingScans, completeCards]);
  const firstMissingCard = cardsNeedingScans[0] ?? cards[0];
  const [cardSlug, setCardSlug] = useState(firstMissingCard?.cardSlug ?? "");
  const [contributorEmail, setContributorEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const selectedCard = useMemo(() => cards.find((card) => card.cardSlug === cardSlug), [cardSlug, cards]);
  const selectedMissingSides = selectedCard ? getMissingSides(selectedCard) : [];
  const selectedStatus = selectedCard ? getScanStatusLabel(selectedCard) : "";

  function chooseCard(nextCardSlug: string) {
    setCardSlug(nextCardSlug);
  }

  function chooseFilter(nextFilter: CardFilter) {
    const nextCards = getCardsForFilter(nextFilter, cards, cardsNeedingScans, completeCards);
    const nextCard = nextCards.find((card) => card.cardSlug === cardSlug) ?? nextCards[0];

    setCardFilter(nextFilter);

    if (nextCard && nextCard.cardSlug !== cardSlug) {
      setCardSlug(nextCard.cardSlug);
    }
  }

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cardSlug || (!frontFile && !backFile) || !contributorEmail.trim()) {
      setStatus("error");
      setMessage("Choose a card, add your email, and select at least one scan image.");
      return;
    }

    setStatus("submitting");
    setMessage("Uploading your scan for moderation...");

    const formData = new FormData();
    formData.set("cardSlug", cardSlug);
    formData.set("contributorEmail", contributorEmail.trim());
    formData.set("notes", notes.trim());
    if (frontFile) {
      formData.set("frontFile", frontFile);
    }
    if (backFile) {
      formData.set("backFile", backFile);
    }

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
      setMessage(`Submitted ${formatSubmittedSides(result.submissions?.map((submission) => submission.side) ?? [])} for ${selectedCard?.playerName ?? "card"} for moderator review.`);
      setFrontFile(null);
      setBackFile(null);
      setNotes("");
    } catch {
      setStatus("error");
      setMessage("Submission failed. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={submitScan} className="grid gap-4 rounded-lg border border-archive-ink/10 bg-white/66 p-6 shadow-card">
      <label className="grid gap-2 text-sm font-bold">
        Show
        <select
          value={cardFilter}
          onChange={(event) => chooseFilter(event.target.value as CardFilter)}
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
        >
          <option value="needed">Scans needed ({cardsNeedingScans.length})</option>
          <option value="complete">Complete cards ({completeCards.length})</option>
          <option value="all">All cards ({cards.length})</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Card
        <select
          value={cardSlug}
          onChange={(event) => chooseCard(event.target.value)}
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
          required
        >
          {filteredCards.map((card) => (
            <option key={card.id} value={card.cardSlug}>
              {card.numberLabel ?? `#${card.number}`} {card.playerName}
            </option>
          ))}
        </select>
        {selectedCard ? (
          <span className="text-xs font-bold uppercase text-archive-ink/52">
            {selectedCard.year ? `${selectedCard.year} ` : ""}
            {selectedCard.setName ? `${selectedCard.setName} - ` : ""}
            {selectedStatus}
          </span>
        ) : null}
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
      <div className="grid gap-3 sm:grid-cols-2">
        <ScanFileField
          file={frontFile}
          isNeeded={selectedMissingSides.includes("front")}
          label="Front scan"
          onChange={setFrontFile}
        />
        <ScanFileField
          file={backFile}
          isNeeded={selectedMissingSides.includes("back")}
          label="Back scan"
          onChange={setBackFile}
        />
      </div>
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

function ScanFileField({
  file,
  isNeeded,
  label,
  onChange
}: {
  file: File | null;
  isNeeded: boolean;
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="grid min-h-36 cursor-pointer place-items-center rounded-lg border border-dashed border-archive-oxblood/40 bg-archive-paper/70 p-6 text-center text-sm font-bold text-archive-oxblood">
      <Upload className="mb-2 h-7 w-7" />
      {file ? file.name : `Upload ${label.toLowerCase()}`}
      <span className="mt-1 text-xs font-bold uppercase text-archive-ink/52">{isNeeded ? "needed" : "already exists"}</span>
      <span className="mt-1 text-xs font-semibold text-archive-ink/52">JPG, PNG, or WebP up to 10 MB</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function getMissingSides(card: Card) {
  return card.images.filter((image) => image.status === "missing").map((image) => image.side);
}

function getCardsForFilter(filter: CardFilter, cards: Card[], cardsNeedingScans: Card[], completeCards: Card[]) {
  if (filter === "needed") {
    return cardsNeedingScans;
  }

  if (filter === "complete") {
    return completeCards;
  }

  return cards;
}

function getScanStatusLabel(card: Card) {
  const missingSides = getMissingSides(card);

  if (missingSides.length === 0) {
    return "complete";
  }

  return `needs ${missingSides.join(" + ")}`;
}

function formatSubmittedSides(sides: CardImageSide[]) {
  if (sides.includes("front") && sides.includes("back")) {
    return "front and back scans";
  }

  if (sides.includes("front")) {
    return "front scan";
  }

  if (sides.includes("back")) {
    return "back scan";
  }

  return "scan";
}
