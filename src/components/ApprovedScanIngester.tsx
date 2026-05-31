"use client";

import { CheckCircle2, Copy, FileJson, ShieldCheck, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

type ManifestItem = {
  cardSlug?: string;
  side?: "front" | "back";
  sourceUrl?: string;
  sourceName?: string;
  rightsConfirmed?: boolean;
  crop?: {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
  };
};

const exampleManifest = JSON.stringify(
  [
    {
      cardSlug: "3-roberto-alomar",
      side: "front",
      sourceUrl: "https://example.com/owned-or-licensed-front.webp",
      sourceName: "Owned scan or licensed source",
      rightsConfirmed: true,
      crop: {
        left: 120,
        top: 130,
        width: 950,
        height: 1330
      }
    }
  ],
  null,
  2
);

export function ApprovedScanIngester() {
  const [manifestText, setManifestText] = useState(exampleManifest);
  const parsed = useMemo(() => parseManifest(manifestText), [manifestText]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-card backdrop-blur">
        <div className="mb-4 flex items-center gap-3">
          <FileJson className="h-6 w-6 text-archive-oxblood" />
          <div>
            <h2 className="font-display text-3xl font-bold">Approved Scan Manifest</h2>
            <p className="text-sm font-semibold text-archive-ink/60">Paste owned, licensed, or permissioned image URLs.</p>
          </div>
        </div>
        <textarea
          value={manifestText}
          onChange={(event) => setManifestText(event.target.value)}
          spellCheck={false}
          className="min-h-[420px] w-full rounded-lg border border-archive-ink/12 bg-archive-ink p-4 font-mono text-sm leading-6 text-white outline-none focus:border-archive-brass"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(manifestText)}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-ink px-3 text-sm font-bold text-white"
          >
            <Copy className="h-4 w-4" />
            Copy manifest
          </button>
          <button
            type="button"
            onClick={() => setManifestText(exampleManifest)}
            className="h-10 rounded-md border border-archive-ink/12 bg-white px-3 text-sm font-bold text-archive-ink"
          >
            Reset example
          </button>
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
          <h3 className="font-display text-2xl font-bold">Validation</h3>
          {parsed.ok ? (
            <div className="mt-3 rounded-md border border-archive-field/20 bg-archive-field/10 p-3 text-sm font-bold text-archive-field">
              <CheckCircle2 className="mb-2 h-5 w-5" />
              {parsed.items.length} approved scan item{parsed.items.length === 1 ? "" : "s"} ready.
            </div>
          ) : (
            <div className="mt-3 rounded-md border border-archive-oxblood/20 bg-archive-oxblood/10 p-3 text-sm font-bold text-archive-oxblood">
              <TriangleAlert className="mb-2 h-5 w-5" />
              {parsed.error}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
          <h3 className="font-display text-2xl font-bold">Command</h3>
          <p className="mt-2 text-sm leading-6 text-archive-ink/68">Save the manifest as a JSON file, then run:</p>
          <pre className="mt-3 overflow-auto rounded-md bg-archive-ink p-3 text-xs font-bold text-white">
            npm run ingest-approved-scans -- scripts/my-approved-scans.json
          </pre>
        </section>

        <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-archive-field" />
            <h3 className="font-display text-2xl font-bold">Rules</h3>
          </div>
          <div className="grid gap-2 text-sm leading-6 text-archive-ink/68">
            <p>Use owned scans, licensed images, or explicit permissioned sources.</p>
            <p>Every item must set <code className="font-bold">rightsConfirmed: true</code>.</p>
            <p>This page prepares the ingest plan. The actual file writing still runs locally for now.</p>
          </div>
        </section>

        {parsed.ok ? (
          <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
            <h3 className="font-display text-2xl font-bold">Items</h3>
            <div className="mt-3 grid gap-3">
              {parsed.items.map((item, index) => (
                <div key={`${item.cardSlug}-${item.side}-${index}`} className="rounded-md border border-archive-ink/10 bg-white/70 p-3">
                  <p className="font-bold">{item.cardSlug}</p>
                  <p className="text-sm capitalize text-archive-ink/62">{item.side}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-archive-ink/48">{item.sourceName}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function parseManifest(text: string): { ok: true; items: ManifestItem[] } | { ok: false; error: string } {
  try {
    const value = JSON.parse(text) as unknown;

    if (!Array.isArray(value)) {
      return { ok: false, error: "Manifest must be a JSON array." };
    }

    for (const item of value as ManifestItem[]) {
      if (!item.cardSlug || !item.side || !item.sourceUrl || !item.sourceName) {
        return { ok: false, error: "Each item needs cardSlug, side, sourceUrl, and sourceName." };
      }

      if (!["front", "back"].includes(item.side)) {
        return { ok: false, error: `Invalid side for ${item.cardSlug}. Use front or back.` };
      }

      if (item.rightsConfirmed !== true) {
        return { ok: false, error: `${item.cardSlug} ${item.side} needs rightsConfirmed: true.` };
      }
    }

    return { ok: true, items: value as ManifestItem[] };
  } catch {
    return { ok: false, error: "Manifest is not valid JSON yet." };
  }
}
