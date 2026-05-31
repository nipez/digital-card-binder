"use client";

import { useMemo, useState } from "react";
import { BinderPage } from "@/components/BinderPage";
import { FilterBar } from "@/components/FilterBar";
import { hasMissingScan } from "@/lib/demo-data";
import type { Card, FilterState } from "@/types/binder";

export function SetBinderClient({
  cards,
  teams,
  initialFilters = {}
}: {
  cards: Card[];
  teams: { slug: string; name: string; count: number }[];
  initialFilters?: FilterState;
}) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
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

  return (
    <div className="grid gap-5">
      <FilterBar teams={teams} filters={filters} onChange={setFilters} />
      <BinderPage cards={visibleCards} />
      {visibleCards.length === 0 ? (
        <p className="rounded-lg border border-archive-ink/10 bg-white/62 p-5 text-center font-bold text-archive-ink/62">
          No cards match those filters.
        </p>
      ) : null}
    </div>
  );
}
