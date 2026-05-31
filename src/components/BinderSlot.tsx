"use client";

import Link from "next/link";
import { ImageOff, Medal, RotateCcw, Sparkle } from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/binder";
import { hasMissingScan } from "@/lib/demo-data";
import { FlipCard } from "@/components/FlipCard";

export function BinderSlot({ card, flipped = false }: { card: Card; flipped?: boolean }) {
  const [slotFlipped, setSlotFlipped] = useState(false);
  const isFlipped = flipped || slotFlipped;

  return (
    <div className="group relative rounded-lg border border-white/70 bg-white/46 p-2 shadow-sleeve backdrop-blur-sm transition hover:-translate-y-1">
      <Link href={`/cards/${card.cardSlug}`} className="block">
        <FlipCard card={card} interactive={false} forceFlipped={isFlipped} />
      </Link>
      <div className="mt-2 grid min-h-14 grid-cols-[1fr_auto] items-start gap-2 px-1">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1 text-archive-oxblood">
            {card.isRookie ? <Sparkle className="h-3.5 w-3.5" aria-label="Rookie card" /> : null}
            {card.isHallOfFamer ? <Medal className="h-3.5 w-3.5" aria-label="Hall of Famer" /> : null}
            {hasMissingScan(card) ? <ImageOff className="h-3.5 w-3.5" aria-label="Missing scan" /> : null}
            <span className="text-xs font-bold text-archive-ink/58">#{card.number}</span>
          </div>
          <p className="truncate text-sm font-bold leading-4 text-archive-ink">{card.playerName}</p>
          <p className="truncate text-[11px] font-semibold uppercase text-archive-ink/55">{card.team}</p>
        </div>
        <button
          type="button"
          onClick={() => setSlotFlipped((value) => !value)}
          className="grid h-9 w-9 place-items-center rounded-md border border-archive-ink/10 bg-white text-archive-ink shadow-sm transition hover:bg-archive-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-archive-brass"
          aria-label={`Flip ${card.playerName}`}
          title={`Flip ${card.playerName}`}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
