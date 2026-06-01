"use client";

import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import type { Card } from "@/types/binder";

export function AdminCardImageUploader({ cards, initialCardSlug }: { cards: Card[]; initialCardSlug?: string }) {
  const [cardSlug, setCardSlug] = useState(initialCardSlug ?? cards[0]?.cardSlug ?? "");
  const [side, setSide] = useState<"front" | "back">("front");
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const selectedCard = cards.find((card) => card.cardSlug === cardSlug);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  async function uploadImage() {
    if (!file || !cardSlug || !token) {
      setStatus("error");
      setMessage("Choose a card, image, side, and enter the admin token.");
      return;
    }

    setStatus("saving");
    setMessage("Uploading image...");
    setUploadedUrl("");

    const formData = new FormData();
    formData.set("cardSlug", cardSlug);
    formData.set("side", side);
    formData.set("file", file);

    const response = await fetch("/api/admin/card-images", {
      method: "POST",
      headers: {
        "x-admin-upload-token": token
      },
      body: formData
    });
    const result = (await response.json()) as { error?: string; imageUrl?: string };

    if (!response.ok || result.error) {
      setStatus("error");
      setMessage(result.error ?? "Upload failed.");
      return;
    }

    setStatus("saved");
    setMessage(`${side === "front" ? "Front" : "Back"} image saved for ${selectedCard?.playerName ?? "card"}.`);
    setUploadedUrl(result.imageUrl ?? "");
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
              Upload a front or back scan directly into Supabase Storage and approve it on the card.
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
              onChange={(event) => setCardSlug(event.target.value)}
              className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 font-normal outline-none focus:border-archive-oxblood"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.cardSlug}>
                  #{card.number} {card.playerName} - {card.team}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["front", "back"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSide(value)}
                className={`h-11 rounded-md border px-3 text-sm font-bold capitalize transition ${
                  side === value ? "border-archive-oxblood bg-archive-oxblood text-white" : "border-archive-ink/12 bg-white text-archive-ink"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <label className="grid min-h-56 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-archive-oxblood/40 bg-archive-paper/70 p-6 text-center text-sm font-bold text-archive-oxblood">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Selected scan preview" className="max-h-[460px] max-w-full rounded-md object-contain shadow-card" />
            ) : (
              <span>
                <UploadCloud className="mx-auto mb-2 h-8 w-8" />
                Choose image from your computer
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="button"
            onClick={uploadImage}
            disabled={status === "saving"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-archive-ink px-4 text-sm font-bold text-white disabled:opacity-55"
          >
            {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Save approved image
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
          <h2 className="font-display text-2xl font-bold">Selected Card</h2>
          {selectedCard ? (
            <div className="mt-3 grid gap-2 text-sm">
              <p className="font-bold">
                #{selectedCard.number} {selectedCard.playerName}
              </p>
              <p className="text-archive-ink/62">{selectedCard.team}</p>
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
            <li>3. Pick front or back, upload, save.</li>
            <li>4. Refresh the card page after it saves.</li>
          </ol>
        </section>

        {uploadedUrl ? (
          <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-sm backdrop-blur">
            <h2 className="font-display text-2xl font-bold">Saved URL</h2>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(uploadedUrl)}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-archive-ink px-3 py-2 text-sm font-bold text-white"
            >
              <Copy className="h-4 w-4" />
              Copy URL
            </button>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
