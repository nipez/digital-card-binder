import { CheckCircle2, ImageOff, Star } from "lucide-react";
import type { Card } from "@/types/binder";
import { hasMissingScan } from "@/lib/demo-data";

export function CompletionStats({ cards, totalCards }: { cards: Card[]; totalCards: number }) {
  const demoComplete = cards.filter((card) => !hasMissingScan(card)).length;
  const missing = cards.filter(hasMissingScan).length;
  const hof = cards.filter((card) => card.isHallOfFamer).length;
  const percent = Math.round((demoComplete / cards.length) * 100);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Demo scans complete" value={`${percent}%`} />
      <Stat icon={<ImageOff className="h-5 w-5" />} label="Cards needing scans" value={String(missing)} />
      <Stat icon={<Star className="h-5 w-5" />} label={`Hall of Famers in ${cards.length} demo`} value={String(hof)} />
      <p className="sm:col-span-3 text-xs font-semibold uppercase text-current/58">
        {cards.length} demo cards loaded from an {totalCards}-card checklist target.
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-current/12 bg-white/24 p-4">
      <div className="mb-3 text-archive-brass">{icon}</div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="text-xs font-bold uppercase opacity-70">{label}</div>
    </div>
  );
}
