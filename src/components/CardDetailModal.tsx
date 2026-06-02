import Link from "next/link";
import { ArrowLeft, ImagePlus, ImageOff, Medal, Sparkle } from "lucide-react";
import type { Card } from "@/types/binder";
import { FlipCard } from "@/components/FlipCard";
import { CollectionActions } from "@/components/CollectionActions";
import { hasMissingScan } from "@/lib/demo-data";
import { getPlayerSlug } from "@/lib/player-profiles";

export function CardDetailModal({ card }: { card: Card }) {
  const displayNumber = card.numberLabel ?? `#${card.number}`;
  const backHref = card.returnHref ?? "/sets/1989-upper-deck-baseball";
  const backLabel = card.returnLabel ?? "Back to binder";

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-archive-oxblood">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <Link
        href={`/admin/card-image-uploader?cardSlug=${card.cardSlug}`}
        className="mb-6 ml-3 inline-flex items-center gap-2 rounded-md border border-archive-ink/10 bg-white/72 px-3 py-2 text-sm font-bold text-archive-ink shadow-sm"
      >
        <ImagePlus className="h-4 w-4" />
        Admin upload scan
      </Link>
      <section className="grid items-start gap-8 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="mx-auto w-full max-w-[360px]">
          <FlipCard card={card} large />
          <p className="mt-3 text-center text-sm font-bold text-archive-ink/70">
            {displayNumber} {card.playerName} • {card.team}
          </p>
        </div>
        <div className="rounded-lg border border-archive-ink/10 bg-white/62 p-6 shadow-card">
          <p className="text-sm font-bold uppercase text-archive-oxblood">
            {card.year ? `${card.year} ` : ""}
            {card.setName ?? "Card"} {displayNumber}
          </p>
          <h1 className="mt-2 font-display text-5xl font-bold">
            <Link href={`/players/${getPlayerSlug(card.playerName)}`} className="transition hover:text-archive-oxblood">
              {card.playerName}
            </Link>
          </h1>
          <p className="mt-2 text-lg font-semibold text-archive-ink/72">
            {card.team} • {card.position}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {card.isRookie ? <Badge icon={<Sparkle className="h-4 w-4" />} label="Rookie card" /> : null}
            {card.isHallOfFamer ? <Badge icon={<Medal className="h-4 w-4" />} label="Hall of Famer" /> : null}
            {card.category && !card.isRookie ? <Badge icon={<Sparkle className="h-4 w-4" />} label={card.category} /> : null}
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
                  <p className="font-bold capitalize">{image.side} scan</p>
                  <p className="text-sm text-archive-ink/62">{image.status === "missing" ? "Scan needed" : "Available"}</p>
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
