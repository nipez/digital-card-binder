import Link from "next/link";
import { ArrowLeft, ImageOff, Medal, Sparkle } from "lucide-react";
import type { Card } from "@/types/binder";
import { FlipCard } from "@/components/FlipCard";
import { CollectionActions } from "@/components/CollectionActions";
import { hasMissingScan } from "@/lib/demo-data";

export function CardDetailModal({ card }: { card: Card }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/sets/1989-upper-deck-baseball" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-archive-oxblood">
        <ArrowLeft className="h-4 w-4" />
        Back to binder
      </Link>
      <section className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <FlipCard card={card} large />
        <div className="rounded-lg border border-archive-ink/10 bg-white/62 p-6 shadow-card">
          <p className="text-sm font-bold uppercase text-archive-oxblood">Card #{card.number}</p>
          <h1 className="mt-2 font-display text-5xl font-bold">{card.playerName}</h1>
          <p className="mt-2 text-lg font-semibold text-archive-ink/72">
            {card.team} • {card.position}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {card.isRookie ? <Badge icon={<Sparkle className="h-4 w-4" />} label="Rookie card" /> : null}
            {card.isHallOfFamer ? <Badge icon={<Medal className="h-4 w-4" />} label="Hall of Famer" /> : null}
            {hasMissingScan(card) ? <Badge icon={<ImageOff className="h-4 w-4" />} label="Scan needed" /> : null}
          </div>
          <p className="mt-6 leading-7 text-archive-ink/72">{card.notes}</p>
          <div className="mt-7 border-t border-archive-ink/10 pt-5">
            <h2 className="mb-3 font-display text-2xl font-bold">Collection</h2>
            <CollectionActions />
          </div>
          <div className="mt-7 border-t border-archive-ink/10 pt-5">
            <h2 className="mb-3 font-display text-2xl font-bold">Scans</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {card.images.map((image) => (
                <div key={image.side} className="rounded-md border border-archive-ink/10 bg-archive-paper/60 p-3">
                  <p className="font-bold capitalize">{image.side}</p>
                  <p className="text-sm text-archive-ink/62">{image.status === "missing" ? `${image.side} scan needed` : "Approved demo placeholder"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-archive-brass/45 bg-archive-brass/12 px-3 py-1 text-sm font-bold text-archive-oxblood">
      {icon}
      {label}
    </span>
  );
}
