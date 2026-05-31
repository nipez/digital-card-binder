import { CompletionStats } from "@/components/CompletionStats";
import { SetBinderClient } from "@/components/SetBinderClient";
import { SetHeader } from "@/components/SetHeader";
import { buildTeams, getUpperDeckSetData } from "@/lib/supabase-data";

export const revalidate = 60;

export default async function SetPage() {
  const { set, cards, source } = await getUpperDeckSetData();

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8">
      <section className="grid gap-5 rounded-lg border border-archive-ink/10 bg-white/54 p-6 shadow-sm lg:grid-cols-[1fr_440px]">
        <SetHeader set={set} />
        <CompletionStats cards={cards} totalCards={set.totalCards} />
      </section>
      {source === "supabase" ? (
        <p className="rounded-md border border-archive-field/20 bg-archive-field/10 px-4 py-2 text-sm font-bold text-archive-field">
          Reading cards from Supabase.
        </p>
      ) : null}
      <SetBinderClient cards={cards} teams={buildTeams(cards)} />
    </main>
  );
}
