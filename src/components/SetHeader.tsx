import type { SetSummary } from "@/types/binder";
import { cn } from "@/lib/utils";

export function SetHeader({ set, compact = false }: { set: SetSummary; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", compact ? "text-white" : "text-archive-ink")}>
      <div>
        <p className={cn("text-sm font-bold uppercase", compact ? "text-white/72" : "text-archive-oxblood")}>
          {set.year} {set.manufacturer}
        </p>
        <h1 className={cn("font-display font-bold leading-tight", compact ? "text-3xl" : "text-4xl md:text-6xl")}>
          {set.name}
        </h1>
      </div>
      <p className={cn("max-w-3xl leading-7", compact ? "text-white/82" : "text-archive-ink/72")}>{set.description}</p>
    </div>
  );
}
