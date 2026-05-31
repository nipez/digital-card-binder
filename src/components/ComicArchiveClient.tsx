"use client";

import Link from "next/link";
import { Archive, BadgeCheck, BookMarked, ChevronLeft, ChevronRight, Heart, ImageOff, RotateCcw, Search, SlidersHorizontal, Star, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { comicHasMissingScan } from "@/lib/comic-demo-data";
import { slugify } from "@/lib/utils";
import type { ComicFilterState, ComicIssue } from "@/types/comics";

const pageSize = 8;

export function ComicArchiveClient({
  issues,
  publishers,
  collections
}: {
  issues: ComicIssue[];
  publishers: { slug: string; name: string; count: number }[];
  collections: { slug: string; name: string; count: number }[];
}) {
  const [filters, setFilters] = useState<ComicFilterState>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const visibleIssues = useMemo(() => {
    return issues.filter((issue) => {
      const query = filters.query?.toLowerCase().trim();
      const matchesQuery =
        !query ||
        issue.title.toLowerCase().includes(query) ||
        issue.series.toLowerCase().includes(query) ||
        issue.publisher.toLowerCase().includes(query) ||
        issue.creators.join(" ").toLowerCase().includes(query);
      const matchesPublisher = !filters.publisher || slugify(issue.publisher) === filters.publisher;
      const matchesCollection = !filters.collection || slugify(issue.collection) === filters.collection;
      const matchesKey = !filters.keyOnly || issue.keyIssue;
      const matchesMissing = !filters.missingOnly || comicHasMissingScan(issue);

      return matchesQuery && matchesPublisher && matchesCollection && matchesKey && matchesMissing;
    });
  }, [filters, issues]);

  const pageCount = Math.max(1, Math.ceil(visibleIssues.length / pageSize));
  const pageIssues = visibleIssues.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  const coverComplete = issues.filter((issue) => issue.images.find((image) => image.side === "cover")?.status !== "missing").length;
  const backComplete = issues.filter((issue) => issue.images.find((image) => image.side === "back")?.status !== "missing").length;
  const missingIssues = issues.filter(comicHasMissingScan).length;

  function updateFilters(nextFilters: ComicFilterState) {
    setFilters(nextFilters);
    setPageIndex(0);
    setFlipped(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,65,49,0.16),transparent_32%),linear-gradient(90deg,rgba(20,24,31,0.08)_0_1px,transparent_1px_100%),linear-gradient(rgba(20,24,31,0.07)_0_1px,transparent_1px_100%),#f3ead8] bg-[length:auto,36px_36px,36px_36px,auto]">
      <section className="border-b border-archive-ink/10 bg-[linear-gradient(135deg,rgba(25,29,38,0.96),rgba(116,34,41,0.88)),url('/placeholders/binder-texture.svg')] bg-cover text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1fr_420px] lg:py-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm font-bold">
              <BookMarked className="h-4 w-4" />
              Binder Archive v2
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">Comic Library</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/84">
              A premium longbox view for comic collectors: flip covers and backs, group by shelf collections,
              track missing scans, and keep key issues visible without turning the hobby into a spreadsheet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#library" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#f2c14e] px-4 text-sm font-bold text-archive-ink shadow-card">
                Open the longbox <ChevronRight className="h-4 w-4" />
              </a>
              <Link href="/sets/1989-upper-deck-baseball" className="inline-flex h-11 items-center rounded-md border border-white/25 px-4 text-sm font-bold text-white">
                Baseball binder
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end rounded-lg border border-white/16 bg-white/10 p-3 shadow-card backdrop-blur">
            {issues.slice(0, 4).map((issue) => (
              <ComicMiniCover key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      </section>

      <section id="library" className="mx-auto grid max-w-7xl gap-5 px-5 py-8">
        <ComicFilterBar publishers={publishers} collections={collections} filters={filters} onChange={updateFilters} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-archive-oxblood">curated longbox page</p>
                <h2 className="font-display text-3xl font-bold">Key Issue Shelf</h2>
                <p className="text-sm font-semibold text-archive-ink/58">
                  Showing {visibleIssues.length === 0 ? 0 : pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, visibleIssues.length)} of {visibleIssues.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPageIndex((value) => Math.max(0, value - 1))} disabled={pageIndex === 0} className="grid h-10 w-10 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink disabled:opacity-35" aria-label="Previous comic page">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-20 text-center text-sm font-bold">
                  {pageIndex + 1} / {pageCount}
                </span>
                <button type="button" onClick={() => setPageIndex((value) => Math.min(pageCount - 1, value + 1))} disabled={pageIndex >= pageCount - 1} className="grid h-10 w-10 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink disabled:opacity-35" aria-label="Next comic page">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setFlipped((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-ink px-3 text-sm font-bold text-white">
                  <RotateCcw className="h-4 w-4" />
                  Flip all
                </button>
              </div>
            </div>

            {visibleIssues.length > 0 ? <ComicLongbox issues={pageIssues} flipped={flipped} /> : <p className="rounded-lg border border-archive-ink/10 bg-white/62 p-5 text-center font-bold text-archive-ink/62">No issues match those filters.</p>}
          </section>

          <aside className="grid content-start gap-4">
            <ComicInfoPanel title="Collection Signal">
              <p>Comics need shelves, not just rows. Each issue belongs to a collection, a box, and a scan status.</p>
              <p>The MVP keeps the important browsing actions close: flip, inspect, mark owned, and find missing backs.</p>
            </ComicInfoPanel>
            <ComicInfoPanel title="Archive Health">
              <ComicProgress label="Checklist imported" value={issues.length} total={250} />
              <ComicProgress label="Cover scans" value={coverComplete} total={issues.length} />
              <ComicProgress label="Back scans" value={backComplete} total={issues.length} />
            </ComicInfoPanel>
            <div className="rounded-lg border border-archive-ink/10 bg-archive-ink p-5 text-white shadow-card">
              <h3 className="font-display text-2xl font-bold">Finish the Longbox</h3>
              <p className="mt-2 text-sm leading-6 text-white/72">{missingIssues} demo issues need at least one scan side.</p>
              <Link href="/submit-scan" className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-archive-ink">
                <Upload className="h-4 w-4" />
                Submit a scan
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ComicFilterBar({
  publishers,
  collections,
  filters,
  onChange
}: {
  publishers: { slug: string; name: string; count: number }[];
  collections: { slug: string; name: string; count: number }[];
  filters: ComicFilterState;
  onChange: (filters: ComicFilterState) => void;
}) {
  const view = filters.keyOnly ? "keys" : filters.missingOnly ? "missing" : "all";

  return (
    <div className="grid gap-3 rounded-lg border border-white/74 bg-white/76 p-3 shadow-sm backdrop-blur lg:grid-cols-[1fr_180px_220px_190px]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-ink/50" />
        <input value={filters.query ?? ""} onChange={(event) => onChange({ ...filters, query: event.target.value })} placeholder="Search title, creator, publisher..." className="h-12 w-full rounded-md border border-archive-ink/12 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-archive-oxblood" />
      </label>
      <select value={filters.publisher ?? ""} onChange={(event) => onChange({ ...filters, publisher: event.target.value || undefined })} className="h-12 rounded-md border border-archive-ink/12 bg-white px-3 text-sm font-semibold outline-none focus:border-archive-oxblood">
        <option value="">All publishers</option>
        {publishers.map((publisher) => (
          <option key={publisher.slug} value={publisher.slug}>
            {publisher.name} ({publisher.count})
          </option>
        ))}
      </select>
      <select value={filters.collection ?? ""} onChange={(event) => onChange({ ...filters, collection: event.target.value || undefined })} className="h-12 rounded-md border border-archive-ink/12 bg-white px-3 text-sm font-semibold outline-none focus:border-archive-oxblood">
        <option value="">All collections</option>
        {collections.map((collection) => (
          <option key={collection.slug} value={collection.slug}>
            {collection.name} ({collection.count})
          </option>
        ))}
      </select>
      <label className="relative block">
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-ink/50" />
        <select
          value={view}
          onChange={(event) => {
            const nextView = event.target.value;
            onChange({ ...filters, keyOnly: nextView === "keys", missingOnly: nextView === "missing" });
          }}
          className="h-12 w-full rounded-md border border-archive-ink/12 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-archive-oxblood"
        >
          <option value="all">Full library</option>
          <option value="keys">Key issues</option>
          <option value="missing">Missing scans</option>
        </select>
      </label>
    </div>
  );
}

function ComicLongbox({ issues, flipped }: { issues: ComicIssue[]; flipped: boolean }) {
  const emptySlots = Array.from({ length: Math.max(0, pageSize - issues.length) });

  return (
    <div className="rounded-lg border border-archive-ink/12 bg-[linear-gradient(135deg,rgba(32,34,42,0.12),rgba(184,55,48,0.10)),rgba(255,255,255,0.42)] p-3 shadow-card md:p-5">
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-white/70 bg-white/30 p-2 shadow-[inset_0_10px_28px_rgba(34,29,26,0.10)] md:grid-cols-4 md:gap-4 md:p-4">
        {issues.map((issue) => (
          <ComicIssueSlot key={issue.id} issue={issue} flipped={flipped} />
        ))}
        {emptySlots.map((_, index) => (
          <div key={`empty-${index}`} className="grid aspect-[2/3] place-items-center rounded-lg border border-dashed border-archive-ink/18 bg-white/32 p-2 text-center text-xs font-bold text-archive-ink/40">
            Empty sleeve
          </div>
        ))}
      </div>
    </div>
  );
}

function ComicIssueSlot({ issue, flipped }: { issue: ComicIssue; flipped: boolean }) {
  const [slotFlipped, setSlotFlipped] = useState(false);
  const isFlipped = flipped || slotFlipped;

  return (
    <article className="group rounded-lg border border-white/70 bg-white/50 p-2 shadow-sleeve backdrop-blur-sm transition hover:-translate-y-1">
      <Link href={`/comics/issues/${issue.issueSlug}`} className="block">
        <ComicFlip issue={issue} flipped={isFlipped} />
      </Link>
      <div className="mt-2 grid min-h-20 grid-cols-[1fr_auto] items-start gap-2 px-1">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1 text-archive-oxblood">
            {issue.keyIssue ? <Star className="h-3.5 w-3.5" aria-label="Key issue" /> : null}
            {issue.signed ? <BadgeCheck className="h-3.5 w-3.5" aria-label="Signed" /> : null}
            {comicHasMissingScan(issue) ? <ImageOff className="h-3.5 w-3.5" aria-label="Missing scan" /> : null}
            <span className="text-xs font-bold text-archive-ink/58">{issue.publisher}</span>
          </div>
          <p className="truncate text-sm font-bold leading-4 text-archive-ink">{issue.title}</p>
          <p className="truncate text-[11px] font-semibold uppercase text-archive-ink/55">{issue.collection}</p>
        </div>
        <button type="button" onClick={() => setSlotFlipped((value) => !value)} className="grid h-9 w-9 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink shadow-sm transition hover:bg-archive-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-archive-brass" aria-label={`Flip ${issue.title}`} title={`Flip ${issue.title}`}>
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export function ComicFlip({ issue, flipped = false, large = false }: { issue: ComicIssue; flipped?: boolean; large?: boolean }) {
  return (
    <span data-flipped={flipped} className="flip-card group relative block w-full text-left">
      <span className="flip-card-inner relative block aspect-[2/3] w-full">
        <ComicFace issue={issue} side="cover" large={large} />
        <ComicFace issue={issue} side="back" large={large} />
      </span>
    </span>
  );
}

function ComicFace({ issue, side, large = false }: { issue: ComicIssue; side: "cover" | "back"; large?: boolean }) {
  const scan = issue.images.find((image) => image.side === side);
  const missing = scan?.status === "missing";
  const isBack = side === "back";

  return (
    <span className={`flip-card-face ${isBack ? "flip-card-back absolute inset-0" : "absolute inset-0"} overflow-hidden rounded-md border border-archive-ink/18 bg-white shadow-card`}>
      {missing ? (
        <span className="grid h-full place-items-center border-4 border-dashed border-archive-oxblood/80 bg-white/84 p-4 text-center">
          <span>
            <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-archive-oxblood/12 text-archive-oxblood">
              <Upload className="h-8 w-8" />
            </span>
            <span className="block font-display text-xl font-bold">{isBack ? "Back cover" : "Cover"} scan</span>
            <span className="mt-1 block text-xs font-bold uppercase text-archive-oxblood">needed</span>
          </span>
        </span>
      ) : isBack ? (
        <span className="grid h-full grid-rows-[auto_1fr_auto] bg-[#f8f1df] p-4">
          <span className="flex items-center justify-between border-b-2 border-archive-ink pb-2 text-xs font-black uppercase tracking-wide">
            <span>{issue.publisher}</span>
            <span>{issue.coverDate}</span>
          </span>
          <span className="grid content-center gap-3 text-center">
            <span className="font-display text-2xl font-bold leading-tight">{issue.title}</span>
            <span className="mx-auto h-1 w-16 rounded-full" style={{ backgroundColor: issue.palette.secondary }} />
            <span className="text-sm font-semibold leading-5 text-archive-ink/70">{issue.notes}</span>
          </span>
          <span className="grid gap-1 border-t border-archive-ink/18 pt-3 text-[11px] font-bold uppercase text-archive-ink/58">
            <span>{issue.creators.join(" / ")}</span>
            <span>{issue.box} • Grade {issue.grade}</span>
          </span>
        </span>
      ) : (
        <span className="relative block h-full overflow-hidden p-4 text-white" style={{ background: `linear-gradient(145deg, ${issue.palette.primary}, ${issue.palette.secondary})` }}>
          <span className="absolute -right-8 top-8 h-36 w-36 rounded-full opacity-60" style={{ backgroundColor: issue.palette.accent }} />
          <span className="absolute -bottom-12 left-8 h-40 w-40 rotate-45 border-[18px] border-white/18" />
          <span className="relative z-10 flex h-full flex-col justify-between">
            <span className="flex items-center justify-between text-xs font-black uppercase tracking-wide">
              <span>{issue.publisher}</span>
              <span>#{issue.issueNumber}</span>
            </span>
            <span>
              <span className={`${large ? "text-5xl" : "text-3xl"} block font-display font-bold leading-none`}>{issue.series}</span>
              <span className="mt-2 inline-flex rounded-md bg-white px-2 py-1 text-xs font-black uppercase text-archive-ink">{issue.collection}</span>
            </span>
            <span className="grid gap-1">
              <span className="text-sm font-black uppercase">{issue.coverDate}</span>
              <span className="text-xs font-semibold text-white/78">{issue.creators.slice(0, 2).join(" / ")}</span>
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

function ComicMiniCover({ issue }: { issue: ComicIssue }) {
  return (
    <div className="aspect-[2/3] overflow-hidden rounded-md border border-white/18 p-3 text-white shadow-card" style={{ background: `linear-gradient(145deg, ${issue.palette.primary}, ${issue.palette.secondary})` }}>
      <div className="flex h-full flex-col justify-between">
        <p className="text-xs font-black uppercase">{issue.publisher}</p>
        <p className="font-display text-2xl font-bold leading-none">{issue.series}</p>
        <p className="text-xs font-bold">#{issue.issueNumber}</p>
      </div>
    </div>
  );
}

function ComicInfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/74 bg-white/70 p-5 shadow-sm backdrop-blur">
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-archive-ink/68">{children}</div>
    </section>
  );
}

function ComicProgress({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-md bg-archive-ink/10">
        <div className="h-full rounded-md bg-[#c33b35]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ComicActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        ["Read it", BookMarked],
        ["Own it", Archive],
        ["Want it", Heart],
        ["Favorite", Star]
      ].map(([label, Icon]) => (
        <button key={label as string} type="button" className="inline-flex h-10 items-center gap-2 rounded-md border border-archive-ink/10 bg-white px-3 text-sm font-bold shadow-sm transition hover:-translate-y-0.5">
          <Icon className="h-4 w-4" />
          {label as string}
        </button>
      ))}
    </div>
  );
}
