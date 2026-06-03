"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BinderPage } from "@/components/BinderPage";
import { FilterBar } from "@/components/FilterBar";
import { hasMissingScan } from "@/lib/demo-data";
import type { Card, FilterState } from "@/types/binder";

const pageSize = 9;

export function SetBinderClient({
  cards,
  teams,
  totalCards,
  initialFilters = {}
}: {
  cards: Card[];
  teams: { slug: string; name: string; count: number }[];
  totalCards: number;
  initialFilters?: FilterState;
}) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [pageIndex, setPageIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const visibleCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesQuery = !filters.query || card.playerName.toLowerCase().includes(filters.query.toLowerCase());
      const matchesTeam = !filters.team || card.teamSlug === filters.team;
      const matchesRookie = !filters.rookieOnly || card.isRookie;
      const matchesHof = !filters.hofOnly || card.isHallOfFamer;
      const matchesMissing = !filters.missingOnly || hasMissingScan(card);
      return matchesQuery && matchesTeam && matchesRookie && matchesHof && matchesMissing;
    });
  }, [cards, filters]);
  const pageCount = Math.max(1, Math.ceil(visibleCards.length / pageSize));
  const pageCards = visibleCards.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);
  const frontComplete = cards.filter((card) => card.images.find((image) => image.side === "front")?.status !== "missing").length;
  const backComplete = cards.filter((card) => card.images.find((image) => image.side === "back")?.status !== "missing").length;
  const missingCards = cards.filter(hasMissingScan).length;

  function handleFiltersChange(nextFilters: FilterState) {
    setFilters(nextFilters);
    setPageIndex(0);
    setFlipped(false);
  }

  return (
    <div className="grid gap-5">
      <FilterBar teams={teams} filters={filters} onChange={handleFiltersChange} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="grid gap-3">
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/74 bg-archive-paper/92 p-4 shadow-card backdrop-blur md:top-3">
            <div>
              <p className="text-xs font-bold uppercase text-archive-oxblood">9-pocket virtual page</p>
              <h2 className="font-display text-3xl font-bold">{filters.team ? `${teams.find((team) => team.slug === filters.team)?.name} Binder` : "Full Set Binder"}</h2>
              <p className="text-sm font-semibold text-archive-ink/58">
                Showing {visibleCards.length === 0 ? 0 : pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, visibleCards.length)} of {visibleCards.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
                disabled={pageIndex === 0}
                className="grid h-10 w-10 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink disabled:opacity-35"
                aria-label="Previous binder page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-20 text-center text-sm font-bold">
                {pageIndex + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPageIndex((value) => Math.min(pageCount - 1, value + 1))}
                disabled={pageIndex >= pageCount - 1}
                className="grid h-10 w-10 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink disabled:opacity-35"
                aria-label="Next binder page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setFlipped((value) => !value)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-archive-ink px-3 text-sm font-bold text-white shadow-card transition hover:-translate-y-0.5"
              >
                <RotateCcw className="h-4 w-4" />
                Flip page
              </button>
            </div>
          </div>
          {visibleCards.length > 0 ? (
            <BinderPage cards={pageCards} flipped={flipped} />
          ) : (
            <p className="rounded-lg border border-archive-ink/10 bg-white/62 p-5 text-center font-bold text-archive-ink/62">
              No cards match those filters.
            </p>
          )}
        </section>
        <aside className="grid content-start gap-4">
          <InfoPanel title="Why This Feels Different">
            <p>This is the feeling of opening a binder, not scanning a spreadsheet. Each page stays grounded in nine pockets.</p>
            <p>Missing scans become a clear invitation for collectors to help complete the archive.</p>
          </InfoPanel>
          <InfoPanel title="Community Completion">
            <Progress label="Checklist imported" value={cards.length} total={totalCards} />
            <Progress label="Front scans" value={frontComplete} total={cards.length} />
            <Progress label="Back scans" value={backComplete} total={cards.length} />
          </InfoPanel>
          <div className="rounded-lg border border-archive-ink/10 bg-archive-ink p-5 text-white shadow-card">
            <h3 className="font-display text-2xl font-bold">Rebuild the Binder</h3>
            <p className="mt-2 text-sm leading-6 text-white/72">{missingCards} cards still need at least one scan side.</p>
            <Link href="/submit-scan" className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-bold text-archive-ink">
              <Upload className="h-4 w-4" />
              Submit a scan
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/74 bg-white/68 p-5 shadow-sm backdrop-blur">
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      <div className="mt-3 grid gap-3 text-sm leading-6 text-archive-ink/68">{children}</div>
    </section>
  );
}

function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-md bg-archive-ink/10">
        <div className="h-full rounded-md bg-archive-field" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
