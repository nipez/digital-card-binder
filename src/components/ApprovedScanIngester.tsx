"use client";

import { CheckCircle2, Copy, Download, FileImage, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type CardOption = {
  slug: string;
  label: string;
};

type Crop = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type ImageSize = {
  width: number;
  height: number;
};

const defaultCrop: Crop = {
  left: 120,
  top: 130,
  width: 950,
  height: 1330
};

export function ApprovedScanIngester({ cards }: { cards: CardOption[] }) {
  const [cardSlug, setCardSlug] = useState(cards[0]?.slug ?? "");
  const [side, setSide] = useState<"front" | "back">("front");
  const [sourceName, setSourceName] = useState("Owned scan");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [crop, setCrop] = useState<Crop>(defaultCrop);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const manifest = useMemo(
    () =>
      JSON.stringify(
        [
          {
            cardSlug,
            side,
            sourceUrl: sourceUrl || "local-file-upload",
            sourceName,
            rightsConfirmed,
            crop
          }
        ],
        null,
        2
      ),
    [cardSlug, crop, rightsConfirmed, side, sourceName, sourceUrl]
  );

  const canPrepare = Boolean(cardSlug && sourceName && rightsConfirmed && imageUrl);

  useEffect(() => {
    if (!imageUrl || !imageSize || !previewCanvasRef.current) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const canvas = previewCanvasRef.current;
      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      canvas.width = 500;
      canvas.height = 700;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, crop.left, crop.top, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    };
    image.src = imageUrl;
  }, [crop, imageSize, imageUrl]);

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImageUrl(nextUrl);
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      setSourceName(file.name);
      setSourceUrl("local-file-upload");
      setCrop(makeInitialCrop(image.naturalWidth, image.naturalHeight));
    };
    image.src = nextUrl;
  }

  function downloadPreview() {
    const canvas = previewCanvasRef.current;
    if (!canvas || !canPrepare) {
      return;
    }

    const link = document.createElement("a");
    link.download = `${cardSlug}-${side}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-card backdrop-blur">
        <div className="mb-5 flex items-center gap-3">
          <FileImage className="h-6 w-6 text-archive-oxblood" />
          <div>
            <h2 className="font-display text-3xl font-bold">Approved Scan Upload</h2>
            <p className="text-sm font-semibold text-archive-ink/60">Choose a card, upload an image, crop the card, then prepare it for ingest.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            Card
            <select value={cardSlug} onChange={(event) => setCardSlug(event.target.value)} className="h-11 rounded-md border border-archive-ink/12 bg-white px-3 font-semibold">
              {cards.map((card) => (
                <option key={card.slug} value={card.slug}>
                  {card.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Side
            <select value={side} onChange={(event) => setSide(event.target.value as "front" | "back")} className="h-11 rounded-md border border-archive-ink/12 bg-white px-3 font-semibold">
              <option value="front">Front</option>
              <option value="back">Back</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm font-bold md:col-span-2">
            Source name
            <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="h-11 rounded-md border border-archive-ink/12 bg-white px-3 font-semibold" />
          </label>

          <label className="grid gap-2 text-sm font-bold md:col-span-2">
            Approved image URL
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="Optional when using a local file"
              className="h-11 rounded-md border border-archive-ink/12 bg-white px-3 font-semibold"
            />
          </label>

          <label className="grid min-h-32 cursor-pointer place-items-center rounded-lg border border-dashed border-archive-oxblood/40 bg-archive-paper/70 p-5 text-center text-sm font-bold text-archive-oxblood md:col-span-2">
            Upload scan/photo
            <span className="mt-1 block text-xs font-semibold text-archive-ink/50">Use your own scan or a permissioned image file.</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-lg border border-archive-field/20 bg-archive-field/10 p-3 text-sm font-bold text-archive-field">
          <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} className="mt-1 h-4 w-4" />
          I confirm this is an owned scan, licensed image, or explicit permissioned source.
        </label>

        {imageSize ? (
          <div className="mt-5 grid gap-3 rounded-lg border border-archive-ink/10 bg-white/62 p-4">
            <h3 className="font-display text-2xl font-bold">Crop</h3>
            <CropSlider label="Left" value={crop.left} max={imageSize.width - 10} onChange={(value) => setCrop((current) => ({ ...current, left: value }))} />
            <CropSlider label="Top" value={crop.top} max={imageSize.height - 10} onChange={(value) => setCrop((current) => ({ ...current, top: value }))} />
            <CropSlider label="Width" value={crop.width} max={imageSize.width - crop.left} onChange={(value) => setCrop((current) => ({ ...current, width: value }))} />
            <CropSlider label="Height" value={crop.height} max={imageSize.height - crop.top} onChange={(value) => setCrop((current) => ({ ...current, height: value }))} />
          </div>
        ) : null}
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
          <h3 className="font-display text-2xl font-bold">Preview</h3>
          <div className="mt-3 overflow-hidden rounded-lg border border-archive-ink/10 bg-archive-paper">
            {imageUrl ? (
              <canvas ref={previewCanvasRef} className="block aspect-[2.5/3.5] w-full" />
            ) : (
              <div className="grid aspect-[2.5/3.5] place-items-center p-5 text-center text-sm font-bold text-archive-ink/48">Upload an image to preview the crop.</div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadPreview}
              disabled={!canPrepare}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-ink px-3 text-sm font-bold text-white disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Download crop
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(manifest)}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-archive-ink/12 bg-white px-3 text-sm font-bold text-archive-ink"
            >
              <Copy className="h-4 w-4" />
              Copy manifest
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            {canPrepare ? <CheckCircle2 className="h-5 w-5 text-archive-field" /> : <ShieldCheck className="h-5 w-5 text-archive-oxblood" />}
            <h3 className="font-display text-2xl font-bold">Status</h3>
          </div>
          <p className="text-sm leading-6 text-archive-ink/68">
            {canPrepare ? "This scan is ready to be processed locally or wired into the next Supabase upload step." : "Choose a card, upload an image, and confirm rights to prepare a scan."}
          </p>
        </section>

        <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
          <h3 className="font-display text-2xl font-bold">Manifest</h3>
          <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-archive-ink p-3 text-xs font-bold leading-5 text-white">{manifest}</pre>
        </section>
      </aside>
    </div>
  );
}

function CropSlider({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  const safeMax = Math.max(1, Math.floor(max));

  return (
    <label className="grid gap-2 text-sm font-bold">
      <span className="flex items-center justify-between gap-3">
        {label}
        <span>{Math.round(value)} px</span>
      </span>
      <input type="range" min={0} max={safeMax} value={Math.min(value, safeMax)} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function makeInitialCrop(width: number, height: number): Crop {
  const targetRatio = 2.5 / 3.5;
  const sourceRatio = width / height;

  if (sourceRatio > targetRatio) {
    const cropWidth = Math.round(height * targetRatio);
    return {
      left: Math.round((width - cropWidth) / 2),
      top: 0,
      width: cropWidth,
      height
    };
  }

  const cropHeight = Math.round(width / targetRatio);
  return {
    left: 0,
    top: Math.round((height - cropHeight) / 2),
    width,
    height: cropHeight
  };
}
