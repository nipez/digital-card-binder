import Link from "next/link";
import { ImageOff, Medal, Sparkle } from "lucide-react";
import type { Card } from "@/types/binder";
import { hasMissingScan } from "@/lib/demo-data";
import { FlipCard } from "@/components/FlipCard";

export function BinderSlot({ card, flipped = false }: { card: Card; flipped?: boolean }) {
  return (
    <div className="group relative rounded-lg border border-white/70 bg-white/46 p-2 shadow-sleeve backdrop-blur-sm transition hover:-translate-y-1">
      <div className="absolute left-4 top-4 z-10 flex gap-1 text-archive-oxblood">
        {card.isRookie ? <Sparkle className="h-4 w-4 rounded-md bg-white/86 p-0.5 shadow-sm" aria-label="Rookie card" /> : null}
        {card.isHallOfFamer ? <Medal className="h-4 w-4 rounded-md bg-white/86 p-0.5 shadow-sm" aria-label="Hall of Famer" /> : null}
        {hasMissingScan(card) ? <ImageOff className="h-4 w-4 rounded-md bg-white/86 p-0.5 shadow-sm" aria-label="Missing scan" /> : null}
      </div>
      <Link href={`/cards/${card.cardSlug}`} className="block">
        <FlipCard card={card} interactive={false} forceFlipped={flipped} />
      </Link>
    </div>
  );
}
