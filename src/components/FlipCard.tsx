"use client";

import Image from "next/image";
import { RotateCcw } from "lucide-react";
import type { Card } from "@/types/binder";
import { useState } from "react";

export function FlipCard({ card, large = false, interactive = true }: { card: Card; large?: boolean; interactive?: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const front = card.images.find((image) => image.side === "front");
  const back = card.images.find((image) => image.side === "back");
  const content = (
    <>
      {interactive ? (
        <span className="absolute right-3 top-3 z-20 rounded-md bg-archive-ink/70 p-2 text-white opacity-0 transition group-hover:opacity-100">
          <RotateCcw className="h-4 w-4" />
        </span>
      ) : null}
      <span className="flip-card-inner relative block aspect-[2.5/3.5] w-full">
        <CardFace card={card} imageUrl={front?.imageUrl ?? null} label="Front scan needed" large={large} />
        <CardFace card={card} imageUrl={back?.imageUrl ?? null} label="Back scan needed" back large={large} />
      </span>
    </>
  );

  if (!interactive) {
    return (
      <span data-flipped={false} className="flip-card group relative block w-full text-left">
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      data-flipped={flipped}
      onClick={() => setFlipped((value) => !value)}
      className="flip-card group relative block w-full text-left"
      aria-label={`Flip ${card.playerName} card`}
    >
      {content}
    </button>
  );
}

function CardFace({
  card,
  imageUrl,
  label,
  back = false,
  large = false
}: {
  card: Card;
  imageUrl: string | null;
  label: string;
  back?: boolean;
  large?: boolean;
}) {
  return (
    <span
      className={`flip-card-face ${back ? "flip-card-back absolute inset-0" : "absolute inset-0"} overflow-hidden rounded-md border border-archive-ink/14 bg-archive-paper shadow-card`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={`${card.playerName} ${back ? "back" : "front"}`} fill className="object-cover" sizes={large ? "420px" : "210px"} />
      ) : (
        <span className="grid h-full place-items-center bg-white/58 p-4 text-center font-bold text-archive-ink/60">{label}</span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-archive-ink/78 to-transparent p-3 text-white">
        <span className="block text-xs font-bold uppercase">#{card.number} {card.position}</span>
        <span className="block truncate font-display text-lg font-bold">{card.playerName}</span>
      </span>
    </span>
  );
}
