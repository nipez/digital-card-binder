import type { Card } from "@/types/binder";
import { BinderSlot } from "@/components/BinderSlot";

export function BinderPage({ cards, flipped = false }: { cards: Card[]; flipped?: boolean }) {
  const emptySlots = Array.from({ length: Math.max(0, 9 - cards.length) });

  return (
    <div className="relative overflow-hidden rounded-md border border-archive-ink/18 bg-[linear-gradient(90deg,rgba(44,31,22,0.62)_0_54px,rgba(245,248,246,0.18)_54px_56px,rgba(31,42,35,0.52)_56px_100%),linear-gradient(135deg,rgba(39,57,45,0.58),rgba(105,76,40,0.34)),rgba(35,29,23,0.78)] p-3 shadow-card md:p-5">
      <div className="pointer-events-none absolute bottom-0 left-5 top-0 hidden w-7 border-x border-white/10 bg-black/14 shadow-[inset_-10px_0_18px_rgba(0,0,0,0.18)] md:block">
        {[18, 50, 82].map((top) => (
          <span key={top} className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border border-white/45 bg-archive-paper shadow-inner" style={{ top: `${top}%` }} />
        ))}
      </div>
      <div className="relative rounded-md border border-white/36 bg-[linear-gradient(90deg,rgba(255,255,255,0.20),rgba(255,255,255,0.08)),rgba(235,244,240,0.18)] p-2 shadow-[inset_0_16px_34px_rgba(255,255,255,0.16),inset_0_-18px_36px_rgba(19,23,20,0.18)] md:ml-10 md:p-4">
        <div className="grid grid-cols-3 gap-2 rounded-sm bg-white/8 p-1.5 md:gap-4 md:p-3">
          {cards.map((card) => (
            <BinderSlot key={card.id} card={card} flipped={flipped} />
          ))}
          {emptySlots.map((_, index) => (
            <div
              key={`empty-${index}`}
              className="grid aspect-[2.5/3.5] place-items-center rounded-md border border-dashed border-white/30 bg-white/12 p-2 text-center text-xs font-bold text-white/50 shadow-[inset_0_0_18px_rgba(255,255,255,0.12)]"
            >
              Empty pocket
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
