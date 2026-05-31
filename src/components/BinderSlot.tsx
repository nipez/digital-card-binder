import Link from "next/link";
import { ImageOff, Medal, Sparkle } from "lucide-react";
import type { Card } from "@/types/binder";
import { hasMissingScan } from "@/lib/demo-data";
import { FlipCard } from "@/components/FlipCard";

export function BinderSlot({ card }: { card: Card }) {
  return (
    <div className="rounded-lg border border-white/62 bg-archive-sleeve p-3 shadow-sleeve backdrop-blur-sm">
      <Link href={`/cards/${card.cardSlug}`} className="block">
        <FlipCard card={card} interactive={false} />
      </Link>
      <div className="mt-3 flex min-h-12 items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold leading-5">{card.playerName}</p>
          <p className="text-xs font-semibold uppercase text-archive-ink/58">{card.team}</p>
        </div>
        <div className="flex shrink-0 gap-1 text-archive-oxblood">
          {card.isRookie ? <Sparkle className="h-4 w-4" aria-label="Rookie card" /> : null}
          {card.isHallOfFamer ? <Medal className="h-4 w-4" aria-label="Hall of Famer" /> : null}
          {hasMissingScan(card) ? <ImageOff className="h-4 w-4" aria-label="Missing scan" /> : null}
        </div>
      </div>
    </div>
  );
}
