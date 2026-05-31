"use client";

import { Search } from "lucide-react";
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
  return (
    <div className="grid gap-3 rounded-lg border border-archive-ink/10 bg-white/62 p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-archive-ink/50" />
        <input
          value={filters.query ?? ""}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Filter by player"
          className="h-11 w-full rounded-md border border-archive-ink/14 bg-white/80 pl-10 pr-3 text-sm outline-none focus:border-archive-oxblood"
        />
      </label>
      <select
        value={filters.team ?? ""}
        onChange={(event) => onChange({ ...filters, team: event.target.value || undefined })}
        className="h-11 rounded-md border border-archive-ink/14 bg-white/80 px-3 text-sm font-semibold outline-none focus:border-archive-oxblood"
      >
        <option value="">All teams</option>
        {teams.map((team) => (
          <option key={team.slug} value={team.slug}>
            {team.name} ({team.count})
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-2">
        <Toggle label="Rookies" active={Boolean(filters.rookieOnly)} onClick={() => onChange({ ...filters, rookieOnly: !filters.rookieOnly })} />
        <Toggle label="Hall of Famers" active={Boolean(filters.hofOnly)} onClick={() => onChange({ ...filters, hofOnly: !filters.hofOnly })} />
        <Toggle label="Missing scans" active={Boolean(filters.missingOnly)} onClick={() => onChange({ ...filters, missingOnly: !filters.missingOnly })} />
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-md border px-3 text-sm font-bold transition ${
        active ? "border-archive-oxblood bg-archive-oxblood text-white" : "border-archive-ink/14 bg-white/72 text-archive-ink"
      }`}
    >
      {label}
    </button>
  );
}
