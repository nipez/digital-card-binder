import type { Card } from "@/types/binder";
import { BinderSlot } from "@/components/BinderSlot";

export function BinderPage({ cards, flipped = false }: { cards: Card[]; flipped?: boolean }) {
  const emptySlots = Array.from({ length: Math.max(0, 9 - cards.length) });

  return (
    <div className="rounded-lg border border-archive-ink/12 bg-[linear-gradient(135deg,rgba(91,104,99,0.18),rgba(181,138,67,0.14)),rgba(255,255,255,0.40)] p-3 shadow-card md:p-5">
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/68 bg-white/28 p-2 shadow-[inset_0_10px_28px_rgba(34,29,26,0.10)] md:gap-4 md:p-4">
        {cards.map((card) => (
          <BinderSlot key={card.id} card={card} flipped={flipped} />
        ))}
        {emptySlots.map((_, index) => (
          <div
            key={`empty-${index}`}
            className="grid aspect-[2.5/3.5] place-items-center rounded-lg border border-dashed border-archive-ink/18 bg-white/32 p-2 text-center text-xs font-bold text-archive-ink/40"
          >
            Empty slot
          </div>
        ))}
      </div>
    </div>
  );
}
