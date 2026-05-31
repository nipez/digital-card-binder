"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { FilterState } from "@/types/binder";

export function FilterBar({
  teams,
  filters,
  onChange
}: {
  teams: { slug: string; name: string; count: number }[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const view = filters.rookieOnly ? "rookies" : filters.hofOnly ? "hof" : filters.missingOnly ? "missing" : "all";

  return (
    <div className="grid gap-3 rounded-lg border border-white/74 bg-white/70 p-3 shadow-sm backdrop-blur md:grid-cols-[1fr_220px_220px]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-ink/50" />
        <input
          value={filters.query ?? ""}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Search player, card number, team..."
          className="h-12 w-full rounded-md border border-archive-ink/12 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-archive-oxblood"
        />
      </label>
      <select
        value={filters.team ?? ""}
        onChange={(event) => onChange({ ...filters, team: event.target.value || undefined })}
        className="h-12 rounded-md border border-archive-ink/12 bg-white px-3 text-sm font-semibold outline-none focus:border-archive-oxblood"
      >
        <option value="">All teams</option>
        {teams.map((team) => (
          <option key={team.slug} value={team.slug}>
            {team.name} ({team.count})
          </option>
        ))}
      </select>
      <label className="relative block">
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-ink/50" />
        <select
          value={view}
          onChange={(event) => {
            const nextView = event.target.value;
            onChange({
              ...filters,
              rookieOnly: nextView === "rookies",
              hofOnly: nextView === "hof",
              missingOnly: nextView === "missing"
            });
          }}
          className="h-12 w-full rounded-md border border-archive-ink/12 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-archive-oxblood"
        >
          <option value="all">Full binder</option>
          <option value="rookies">Rookies</option>
          <option value="hof">Hall of Famers</option>
          <option value="missing">Missing scans</option>
        </select>
      </label>
    </div>
  );
}
