import Link from "next/link";
import { ImageOff, Medal, Sparkle } from "lucide-react";
import type { Card } from "@/types/binder";
import { hasMissingScan } from "@/lib/demo-data";
import { FlipCard } from "@/components/FlipCard";

export function BinderSlot({ card, flipped = false }: { card: Card; flipped?: boolean }) {
  return (
    <div className="group relative rounded-lg border border-white/70 bg-white/46 p-2 shadow-sleeve backdrop-blur-sm transition hover:-translate-y-1">
      <Link href={`/cards/${card.cardSlug}`} className="block">
        <FlipCard card={card} interactive={false} forceFlipped={flipped} />
      </Link>
      <div className="mt-2 min-h-14 px-1">
        <div className="mb-1 flex items-center gap-1 text-archive-oxblood">
          {card.isRookie ? <Sparkle className="h-3.5 w-3.5" aria-label="Rookie card" /> : null}
          {card.isHallOfFamer ? <Medal className="h-3.5 w-3.5" aria-label="Hall of Famer" /> : null}
          {hasMissingScan(card) ? <ImageOff className="h-3.5 w-3.5" aria-label="Missing scan" /> : null}
          <span className="text-xs font-bold text-archive-ink/58">#{card.number}</span>
        </div>
        <p className="truncate text-sm font-bold leading-4 text-archive-ink">{card.playerName}</p>
        <p className="truncate text-[11px] font-semibold uppercase text-archive-ink/55">{card.team}</p>
      </div>
    </div>
  );
}
