"use client";

import Link from "next/link";
import { ImageOff, Medal, RotateCcw, Sparkle } from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/binder";
import { hasMissingScan } from "@/lib/demo-data";
import { FlipCard } from "@/components/FlipCard";
import { getPlayerSlug } from "@/lib/player-profiles";

export function BinderSlot({ card, flipped = false }: { card: Card; flipped?: boolean }) {
  const [slotFlipped, setSlotFlipped] = useState(false);
  const isFlipped = flipped || slotFlipped;
  const playerHref = card.setId === "1986-fleer-basketball" ? `/cards/${card.cardSlug}` : `/players/${getPlayerSlug(card.playerName)}`;

  return (
    <div className="group relative rounded-md border border-white/42 bg-white/18 p-2 shadow-[inset_0_1px_12px_rgba(255,255,255,0.22),0_12px_28px_rgba(22,18,14,0.28)] backdrop-blur-sm transition hover:-translate-y-1">
      <span className="pointer-events-none absolute inset-1 rounded-sm border border-white/24 shadow-[inset_0_0_20px_rgba(255,255,255,0.12)]" />
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
          <Link
            href={playerHref}
            className="block truncate text-sm font-bold leading-4 text-archive-ink transition hover:text-archive-oxblood hover:underline"
          >
            {card.playerName}
          </Link>
          <p className="truncate text-[11px] font-semibold uppercase text-archive-ink/55">{card.team}</p>
        </div>
        <button
          type="button"
          onClick={() => setSlotFlipped((value) => !value)}
          className="inline-flex h-9 min-w-[74px] items-center justify-center gap-1.5 rounded-md border border-archive-ink/10 bg-white px-2 text-sm font-bold text-archive-ink shadow-sm transition hover:bg-archive-ink hover:text-white focus:outline-none focus:ring-2 focus:ring-archive-brass"
          aria-label={`Flip ${card.playerName}`}
          title={`Flip ${card.playerName}`}
        >
          <RotateCcw className="h-4 w-4" />
          Flip
        </button>
      </div>
    </div>
  );
}
