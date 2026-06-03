"use client";

import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, ExternalLink, ImageOff, ImagePlus, Loader2, RotateCcw, UploadCloud, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Card } from "@/types/binder";

type ScanCleanup = {
  zoom: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};

const defaultCleanup: ScanCleanup = {
  zoom: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0
};

export function AdminCardImageUploader({ cards, initialCardSlug }: { cards: Card[]; initialCardSlug?: string }) {
  const initialMissingCard = cards.find((card) => hasMissingSide(card));
  const [cardSlug, setCardSlug] = useState(initialCardSlug ?? initialMissingCard?.cardSlug ?? cards[0]?.cardSlug ?? "");
  const [token, setToken] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontCleanup, setFrontCleanup] = useState<ScanCleanup>(defaultCleanup);
  const [backCleanup, setBackCleanup] = useState<ScanCleanup>(defaultCleanup);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [completedSides, setCompletedSides] = useState<Record<string, Set<"front" | "back">>>({});
  const selectedCard = cards.find((card) => card.cardSlug === cardSlug);
  const missingCards = useMemo(() => cards.filter((card) => hasMissingSide(card, completedSides[card.cardSlug])), [cards, completedSides]);
  const selectedQueueIndex = missingCards.findIndex((card) => card.cardSlug === cardSlug);
  const selectedMissingSides = selectedCard ? getMissingSides(selectedCard, completedSides[selectedCard.cardSlug]) : [];
  const frontPreviewUrl = useMemo(() => (frontFile ? URL.createObjectURL(frontFile) : ""), [frontFile]);
  const backPreviewUrl = useMemo(() => (backFile ? URL.createObjectURL(backFile) : ""), [backFile]);

  function chooseCard(nextCardSlug: string) {
    setCardSlug(nextCardSlug);
    setFrontFile(null);
    setBackFile(null);
    setFrontCleanup(defaultCleanup);
    setBackCleanup(defaultCleanup);
    setStatus("idle");
    setMessage("");
    setUploadedUrls([]);
  }

  function goToMissing(offset: -1 | 1) {
    if (missingCards.length === 0) {
      return;
    }

    const currentIndex = selectedQueueIndex === -1 ? 0 : selectedQueueIndex;
    const nextIndex = (currentIndex + offset + missingCards.length) % missingCards.length;
    chooseCard(missingCards[nextIndex].cardSlug);
  }

  async function uploadImage() {
    if ((!frontFile && !backFile) || !cardSlug || !token) {
      setStatus("error");
      setMessage("Choose a card, at least one image, and enter the admin token.");
      return;
    }

    setStatus("saving");
    setMessage("Cleaning and uploading image files...");
    setUploadedUrls([]);

    const formData = new FormData();
    formData.set("cardSlug", cardSlug);
    if (frontFile) {
      formData.set("frontFile", await buildCleanedScanFile(frontFile, frontCleanup, `${cardSlug}-front.webp`));
    }
    if (backFile) {
      formData.set("backFile", await buildCleanedScanFile(backFile, backCleanup, `${cardSlug}-back.webp`));
    }

    const response = await fetch("/api/admin/card-images", {
      method: "POST",
      headers: {
        "x-admin-upload-token": token
      },
      body: formData
    });
    const result = (await response.json()) as { error?: string; images?: { imageUrl: string; side: "front" | "back" }[] };

    if (!response.ok || result.error) {
      setStatus("error");
      setMessage(result.error ?? "Upload failed.");
      return;
    }

    const savedSides = result.images?.map((image) => image.side).join(" and ") ?? "image";
    setStatus("saved");
    setMessage(`${savedSides} saved for ${selectedCard?.playerName ?? "card"}.`);
    setUploadedUrls(result.images?.map((image) => image.imageUrl) ?? []);
    setCompletedSides((current) => {
      const next = { ...current };
      const cardCompletedSides = new Set(next[cardSlug] ?? []);
      result.images?.forEach((image) => cardCompletedSides.add(image.side));
      next[cardSlug] = cardCompletedSides;
      return next;
    });
    setFrontFile(null);
    setBackFile(null);
    setFrontCleanup(defaultCleanup);
    setBackCleanup(defaultCleanup);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-card backdrop-blur">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-archive-oxblood/12 text-archive-oxblood">
            <ImagePlus className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-4xl font-bold">Admin Card Image Upload</h1>
            <p className="mt-1 text-sm font-semibold text-archive-ink/62">
              Upload front and back scans together into Supabase Storage and approve them on the card.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
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

          <label className="grid gap-2 text-sm font-bold">
            Card
            <select
              value={cardSlug}
              onChange={(event) => chooseCard(event.target.value)}
              className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.cardSlug}>
                  {card.year ? `${card.year} ` : ""}
                  {card.setName ? `${card.setName} ` : ""}
                  {card.numberLabel ?? `#${card.number}`} {card.playerName} - {card.team}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <ScanFilePicker
              label="Front scan"
              statusLabel={selectedMissingSides.includes("front") ? "Needed" : "Already approved"}
              file={frontFile}
              previewUrl={frontPreviewUrl}
              cleanup={frontCleanup}
              onChange={(file) => {
                setFrontFile(file);
                setFrontCleanup(defaultCleanup);
              }}
              onCleanupChange={setFrontCleanup}
            />
            <ScanFilePicker
              label="Back scan"
              statusLabel={selectedMissingSides.includes("back") ? "Needed" : "Already approved"}
              file={backFile}
              previewUrl={backPreviewUrl}
              cleanup={backCleanup}
              onChange={(file) => {
                setBackFile(file);
                setBackCleanup(defaultCleanup);
              }}
              onCleanupChange={setBackCleanup}
            />
          </div>

          <button
            type="button"
            onClick={uploadImage}
            disabled={status === "saving"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-archive-ink px-4 text-sm font-bold text-white disabled:opacity-55"
          >
            {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Save approved image{frontFile && backFile ? "s" : ""}
          </button>

          {message ? (
            <div
              className={`rounded-md border p-3 text-sm font-bold ${
                status === "error" ? "border-archive-oxblood/30 bg-archive-oxblood/10 text-archive-oxblood" : "border-archive-field/25 bg-archive-field/10 text-archive-field"
              }`}
            >
              {status === "saved" ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : null}
              {message}
            </div>
          ) : null}
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-archive-oxblood/12 text-archive-oxblood">
              <ImageOff className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Missing Scan Queue</h2>
              <p className="mt-1 text-sm font-semibold text-archive-ink/62">
                {missingCards.length === 0 ? "Every visible demo card has both sides." : `${missingCards.length} cards still need a front or back scan.`}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToMissing(-1)}
              disabled={missingCards.length === 0}
              className="grid h-10 w-10 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink disabled:opacity-35"
              aria-label="Previous missing scan"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goToMissing(1)}
              disabled={missingCards.length === 0}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-archive-ink px-3 text-sm font-bold text-white disabled:opacity-35"
            >
              Next missing <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 max-h-72 overflow-auto rounded-md border border-archive-ink/10 bg-white/52">
            {missingCards.length > 0 ? (
              missingCards.slice(0, 24).map((card) => {
                const sides = getMissingSides(card, completedSides[card.cardSlug]);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => chooseCard(card.cardSlug)}
                    className={`grid w-full grid-cols-[1fr_auto] gap-2 border-b border-archive-ink/8 px-3 py-2 text-left text-sm last:border-b-0 ${
                      card.cardSlug === cardSlug ? "bg-archive-brass/18" : "hover:bg-archive-paper/70"
                    }`}
                  >
                    <span>
                      <span className="block font-bold">
                        #{card.number} {card.playerName}
                      </span>
                      <span className="block text-xs font-semibold uppercase text-archive-ink/50">{card.team}</span>
                    </span>
                    <span className="self-center rounded-md bg-archive-oxblood/10 px-2 py-1 text-xs font-bold uppercase text-archive-oxblood">
                      {sides.join(" + ")}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="p-3 text-sm font-bold text-archive-ink/58">No missing scans in this demo set.</p>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="font-display text-2xl font-bold">Selected Card</h2>
          {selectedCard ? (
            <div className="mt-3 grid gap-2 text-sm">
              <p className="font-bold">
                {selectedCard.year ? `${selectedCard.year} ` : ""}
                {selectedCard.setName ? `${selectedCard.setName} ` : ""}
                {selectedCard.numberLabel ?? `#${selectedCard.number}`} {selectedCard.playerName}
              </p>
              <p className="text-archive-ink/62">{selectedCard.team}</p>
              <p className="font-bold text-archive-oxblood">
                {selectedMissingSides.length > 0 ? `Needs ${selectedMissingSides.join(" and ")}` : "Both sides approved"}
              </p>
              <Link href={`/cards/${selectedCard.cardSlug}`} className="inline-flex w-fit items-center gap-2 rounded-md border border-archive-ink/10 bg-white px-3 py-2 font-bold">
                Public page <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-sm backdrop-blur">
          <h2 className="font-display text-2xl font-bold">Fast Workflow</h2>
          <ol className="mt-3 grid gap-2 text-sm leading-6 text-archive-ink/68">
            <li>1. Open a card page.</li>
            <li>2. Click Admin upload scan.</li>
            <li>3. Add front, back, or both in one save.</li>
            <li>4. Open the updated card page after it saves.</li>
          </ol>
        </section>

        {uploadedUrls.length > 0 ? (
          <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-sm backdrop-blur">
            <h2 className="font-display text-2xl font-bold">Saved URLs</h2>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(uploadedUrls.join("\n"))}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-archive-ink px-3 py-2 text-sm font-bold text-white"
            >
              <Copy className="h-4 w-4" />
              Copy URLs
            </button>
            {selectedCard ? (
              <Link
                href={`/cards/${selectedCard.cardSlug}`}
                className="ml-2 mt-3 inline-flex items-center gap-2 rounded-md border border-archive-ink/10 bg-white px-3 py-2 text-sm font-bold text-archive-ink"
              >
                View updated card <ExternalLink className="h-4 w-4" />
              </Link>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function ScanFilePicker({
  label,
  statusLabel,
  file,
  previewUrl,
  cleanup,
  onChange,
  onCleanupChange
}: {
  label: string;
  statusLabel: string;
  file: File | null;
  previewUrl: string;
  cleanup: ScanCleanup;
  onChange: (file: File | null) => void;
  onCleanupChange: (cleanup: ScanCleanup) => void;
}) {
  function updateCleanup(partial: Partial<ScanCleanup>) {
    onCleanupChange({ ...cleanup, ...partial });
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs font-semibold uppercase text-archive-ink/45">{statusLabel}</p>
        </div>
        {file ? (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              onCleanupChange(defaultCleanup);
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-archive-oxblood"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : null}
      </div>
      <label className="grid min-h-72 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-archive-oxblood/40 bg-archive-paper/70 p-4 text-center text-sm font-bold text-archive-oxblood">
        {previewUrl ? (
          <span className="relative grid aspect-[2.5/3.5] w-full max-w-[300px] place-items-center overflow-hidden rounded-md bg-black shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-full w-full object-contain"
              style={{
                transform: `translate(${cleanup.offsetX}%, ${cleanup.offsetY}%) rotate(${cleanup.rotation}deg) scale(${cleanup.zoom})`
              }}
            />
            <span className="pointer-events-none absolute inset-3 rounded border border-dashed border-white/70" />
          </span>
        ) : (
          <span>
            <UploadCloud className="mx-auto mb-2 h-8 w-8" />
            Choose {label.toLowerCase()}
            <span className="mt-1 block text-xs text-archive-ink/50">Cleaned to 750x1050 WebP before upload</span>
          </span>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      </label>
      {file ? (
        <div className="grid gap-2 rounded-md border border-archive-ink/10 bg-white/64 p-3 text-xs font-bold text-archive-ink/70">
          <label className="grid gap-1">
            Rotate
            <input type="range" min="-12" max="12" step="0.25" value={cleanup.rotation} onChange={(event) => updateCleanup({ rotation: Number(event.target.value) })} />
          </label>
          <label className="grid gap-1">
            Zoom
            <input type="range" min="0.8" max="1.8" step="0.02" value={cleanup.zoom} onChange={(event) => updateCleanup({ zoom: Number(event.target.value) })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              X
              <input type="range" min="-35" max="35" step="1" value={cleanup.offsetX} onChange={(event) => updateCleanup({ offsetX: Number(event.target.value) })} />
            </label>
            <label className="grid gap-1">
              Y
              <input type="range" min="-35" max="35" step="1" value={cleanup.offsetY} onChange={(event) => updateCleanup({ offsetY: Number(event.target.value) })} />
            </label>
          </div>
          <button type="button" onClick={() => onCleanupChange(defaultCleanup)} className="inline-flex w-fit items-center gap-1 rounded-md border border-archive-ink/10 bg-white px-2 py-1 font-bold">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset cleanup
          </button>
        </div>
      ) : null}
    </div>
  );
}

async function buildCleanedScanFile(file: File, cleanup: ScanCleanup, fileName: string) {
  const image = await loadImage(URL.createObjectURL(file));
  const canvas = document.createElement("canvas");
  canvas.width = 750;
  canvas.height = 1050;
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  context.fillStyle = "#111111";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((cleanup.rotation * Math.PI) / 180);

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const cardRatio = canvas.width / canvas.height;
  const baseWidth = imageRatio > cardRatio ? canvas.height * imageRatio : canvas.width;
  const baseHeight = imageRatio > cardRatio ? canvas.height : canvas.width / imageRatio;
  const drawWidth = baseWidth * cleanup.zoom;
  const drawHeight = baseHeight * cleanup.zoom;
  const offsetX = (cleanup.offsetX / 100) * canvas.width;
  const offsetY = (cleanup.offsetY / 100) * canvas.height;

  context.drawImage(image, -drawWidth / 2 + offsetX, -drawHeight / 2 + offsetY, drawWidth, drawHeight);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));

  if (!blob) {
    return file;
  }

  return new File([blob], fileName, { type: "image/webp" });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getMissingSides(card: Card, completedSides?: Set<"front" | "back">) {
  return card.images
    .filter((image) => image.status === "missing" && !completedSides?.has(image.side))
    .map((image) => image.side);
}

function hasMissingSide(card: Card, completedSides?: Set<"front" | "back">) {
  return getMissingSides(card, completedSides).length > 0;
}
