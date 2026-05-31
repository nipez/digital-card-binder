import { CompletionStats } from "@/components/CompletionStats";
import { SetBinderClient } from "@/components/SetBinderClient";
import { SetHeader } from "@/components/SetHeader";
import { buildTeams, getUpperDeckSetData } from "@/lib/supabase-data";

export const revalidate = 60;

export default async function SetPage() {
  const { set, cards, source } = await getUpperDeckSetData();

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-5 md:py-8">
      <section className="grid items-end gap-5 rounded-lg border border-white/74 bg-white/62 p-5 shadow-card backdrop-blur lg:grid-cols-[1.15fr_0.85fr] lg:p-7">
        <SetHeader set={set} />
        <CompletionStats cards={cards} totalCards={set.totalCards} />
      </section>
      {source === "supabase" ? (
        <p className="w-fit rounded-md border border-archive-field/20 bg-archive-field/10 px-3 py-2 text-xs font-bold uppercase text-archive-field">
          Reading cards from Supabase.
        </p>
      ) : null}
      <SetBinderClient cards={cards} teams={buildTeams(cards)} />
    </main>
  );
}
