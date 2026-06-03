import { CompletionStats } from "@/components/CompletionStats";
import { SetBinderClient } from "@/components/SetBinderClient";
import { SetHeader } from "@/components/SetHeader";
import { buildTeams, getFleerBasketballSetData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function FleerBasketballSetPage() {
  const { set, cards } = await getFleerBasketballSetData();

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-5 md:py-8">
      <section className="grid gap-5 rounded-lg border border-white/74 bg-white/62 p-5 shadow-card backdrop-blur lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:p-7">
        <div className="grid content-end gap-5">
          <SetHeader set={set} />
          <CompletionStats cards={cards} totalCards={set.totalCards} />
        </div>
        <div className="grid content-end gap-3 rounded-lg border border-archive-ink/10 bg-archive-ink p-5 text-white">
          <p className="text-xs font-bold uppercase text-archive-brass">Iconic card</p>
          <h2 className="font-display text-4xl font-bold">#57 Michael Jordan</h2>
          <p className="leading-7 text-white/78">
            The Jordan rookie anchors this starter checklist alongside Barkley, Ewing, Malone, Olajuwon, Drexler,
            Wilkins, and other Hall of Fame names.
          </p>
        </div>
      </section>
      <SetBinderClient cards={cards} teams={buildTeams(cards)} totalCards={set.totalCards} />
    </main>
  );
}
