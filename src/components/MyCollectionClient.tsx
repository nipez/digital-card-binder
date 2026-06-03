"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CollectionAction } from "@/types/binder";

export type MyCollectionCard = {
  cardNumber: number;
  frontImage?: string | null;
  id: string;
  playerName: string;
  setName?: string;
  setYear?: number;
  slug: string;
  states: CollectionAction[];
  team: string;
};

type Filter = "all" | CollectionAction;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "have", label: "In collection" },
  { id: "want", label: "Want" },
  { id: "favorite", label: "Favorites" }
];

export function MyCollectionClient({ cards }: { cards: MyCollectionCard[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCards = useMemo(
    () =>
      cards.filter((card) => {
        const matchesFilter = filter === "all" || card.states.includes(filter);
        const matchesQuery =
          !normalizedQuery ||
          [card.playerName, card.team, card.setName, String(card.cardNumber)].some((value) => value?.toLowerCase().includes(normalizedQuery));

        return matchesFilter && matchesQuery;
      }),
    [cards, filter, normalizedQuery]
  );

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 rounded-lg border border-white/74 bg-white/64 p-3 shadow-sm md:grid-cols-[1fr_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search player, team, set, or number"
          className="h-11 rounded-md border border-archive-ink/14 bg-white px-3 text-sm font-semibold outline-none focus:border-archive-oxblood"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`h-11 rounded-md border px-3 text-sm font-bold transition ${
                filter === item.id ? "border-archive-field bg-archive-field text-white" : "border-archive-ink/12 bg-white/70 text-archive-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {filteredCards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <Link key={card.id} href={`/cards/${card.slug}`} className="rounded-lg border border-white/74 bg-white/64 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card">
              <span className="grid aspect-[2.5/3.5] place-items-center overflow-hidden rounded-md bg-archive-ink/8">
                {card.frontImage ? (
                  <Image src={card.frontImage} alt={`${card.playerName} front scan`} width={260} height={364} className="h-full w-full object-cover" />
                ) : (
                  <span className="px-4 text-center font-display text-2xl font-bold text-archive-ink/42">Scan needed</span>
                )}
              </span>
              <span className="mt-3 block text-xs font-bold uppercase text-archive-oxblood">
                {card.setYear} {card.setName} #{card.cardNumber}
              </span>
              <span className="mt-1 block text-xl font-bold">{card.playerName}</span>
              <span className="text-sm font-semibold text-archive-ink/58">{card.team}</span>
              <span className="mt-3 flex flex-wrap gap-2">
                {card.states.map((state) => (
                  <span key={state} className="rounded-md bg-archive-field/10 px-2 py-1 text-xs font-black uppercase text-archive-field">
                    {state === "have" ? "In collection" : state}
                  </span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/74 bg-white/64 p-6 shadow-sm">
          <h2 className="font-display text-3xl font-bold">No matches</h2>
          <p className="mt-2 text-archive-ink/70">Adjust the search or collection filter.</p>
        </div>
      )}
    </section>
  );
}
