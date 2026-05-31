import type { Card } from "@/types/binder";
import { BinderSlot } from "@/components/BinderSlot";

export function BinderPage({ cards }: { cards: Card[] }) {
  return (
    <div className="rounded-lg border border-archive-ink/12 bg-[linear-gradient(90deg,rgba(34,29,26,0.13)_0_12px,transparent_12px_100%),rgba(255,255,255,0.34)] p-4 shadow-card md:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <BinderSlot key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
